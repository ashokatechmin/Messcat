import fs from "fs/promises";
import { google } from "googleapis";
import { MessItem, Prisma, PrismaClient } from "@prisma/client";
import ParseDiningMenu, { FindUniqueItems } from "./parse-dining";

const drive = google.drive({
    version: "v3",
    auth: process.env.MESSCAT_GDRIVE
});

async function GetMenu()
{
    const id = process.env.MENU_ID;
    if (id === undefined) throw new Error("MENU_ID is not defined");

    const file = await drive.files.get({
        fileId: id,
        alt: "media",
    }, { responseType: "blob"});

    const data = (file.data as unknown) as Blob;

    if (file.status !== 200) return;
    await fs.writeFile("menu.xlsx", Buffer.from(await data.arrayBuffer()));

    return "menu.xlsx";
}

(async () => {
    const prisma = new PrismaClient();

    if (process.argv.length >= 3) process.env.MENU_ID = process.argv[2];
    const menu = await GetMenu();
    if (menu == undefined) throw new Error("Menu file not found");
    const parsed = await ParseDiningMenu(menu);

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
                count: itemCounts.get(item.name) ?? 0
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

    if (process.argv.length >= 3)
    {
        await fs.rm(menu);
    }
})();