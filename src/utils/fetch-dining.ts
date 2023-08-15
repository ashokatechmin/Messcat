import fs from "fs/promises";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import ParseDiningMenu, { FindUniqueItems } from "./parse-dining";

const auth = new google.auth.OAuth2({
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_SECRET,
});

auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH });

const gmail = google.gmail({
    version: "v1",
    auth
});

const MENU_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function GetMenu()
{
    const {data: {messages: [message]}} = await gmail.users.messages.list({
        userId: "me",
        q: `has:attachment to:technology.ministry@ashoka.edu.in`,
        maxResults: 1
    });

    if (message == undefined) throw new Error("No menu found");

    const {data: {payload: {parts}}} = await gmail.users.messages.get({ userId: "me", id: message.id });
    const menu = parts.find(part => part.mimeType == MENU_MIMETYPE);
    if (menu == undefined) throw new Error("No matching attachment found");

    const {data: {data}} = await gmail.users.messages.attachments.get({ userId: "me", messageId: message.id, id: menu.body.attachmentId });
    const buf = Buffer.from(data, 'base64');

    const menuPath = "menu.xlsx"
    await fs.writeFile(menuPath, buf);

    return menuPath;
}

(async () => {
    
    const menu = await GetMenu();
    const prisma = new PrismaClient();
    const parsed = await ParseDiningMenu(menu);
    await fs.rm(menu);

    parsed.forEach(async weekMenu => {
        const itemCounts = FindUniqueItems(weekMenu);
        const itemNames = Array.from(itemCounts.keys());
        console.log(itemCounts);

        if ((await prisma.dailyMenu.findFirst({where: {date: weekMenu.start}})) != undefined)
        {
            console.log(`Menus already exist for week ${weekMenu.start.toDateString()} - ${weekMenu.end.toDateString()}`);
            return;
        }

        const existingItems = await prisma.messItem.findMany({
            where: {
                name: {
                    in: itemNames
                }
            },
        });

        const execDate = new Date();

        const updatesToExistingItems = existingItems.map(item => prisma.messItem.update({
            where: {id: item.id},
            data: {
                lastSeen: execDate,
                count: itemCounts.get(item.name) + item.count ?? 0
            }
        }));

        await prisma.$transaction(updatesToExistingItems);

        const newItemNames = itemNames.filter(item => !existingItems.some(existing => existing.name == item));

        await prisma.messItem.createMany({
            data: newItemNames.map(item => ({name: item, count: itemCounts.get(item) ?? 0, lastSeen: execDate})),
        });

        for (let i = 0, date = weekMenu.start; i < 7; i++, date.setDate(date.getDate() + 1))
        {
            if ((await prisma.dailyMenu.findFirst({where: {date}})) != undefined)
            {
                throw new Error("Menu already exists for date " + date);
            }
            
            const bfItems = (await prisma.messItem.findMany({
                where: {
                    name: {
                        in: weekMenu.days[i].Breakfast.map(item => item.name)
                    }
                }
            })).map(item => ({id: item.id}));

            const lnItems = (await prisma.messItem.findMany({
                where: {
                    name: {
                        in: weekMenu.days[i].Lunch.map(item => item.name)
                    }
                }
            })).map(item => ({id: item.id}));

            const snItems = (await prisma.messItem.findMany({
                where: {
                    name: {
                        in: weekMenu.days[i].Snacks.map(item => item.name)
                    }
                }
            })).map(item => ({id: item.id}));

            const dnItems = (await prisma.messItem.findMany({
                where: {
                    name: {
                        in: weekMenu.days[i].Dinner.map(item => item.name)
                    }
                }
            })).map(item => ({id: item.id}));

            await prisma.dailyMenu.create({
                data: {
                    date,
                    breakfast: {
                        connect: bfItems,
                    },
                    lunch: {
                        connect: lnItems,
                    },
                    snacks: {
                        connect: snItems,
                    },
                    dinner: {
                        connect: dnItems,
                    }
                }
            });
        }
    });
})();