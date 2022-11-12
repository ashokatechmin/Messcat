import fs from "fs/promises";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import ParseDiningMenu, { FindUniqueItems } from "./parse-dining";

const auth = new google.auth.OAuth2(
	process.env.MESSCAT_GCLIENT,
	process.env.MESSCAT_GSECRET,
)

auth.setCredentials({
    refresh_token: process.env.MESSCAT_GREFRESH,
});

const MENU_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function GetMenu()
{
    const gmail = google.gmail({ version: 'v1', auth });
    const result = await gmail.users.messages.list({ userId: 'me', q: `from: dining@ashoka.edu.in`, maxResults: 1 });

    if (result.data.messages.length == 0)
    {
        throw new Error("No messages found");
    }

    const mail = await (await gmail.users.messages.get({userId: 'me', id: result.data.messages[0].id})).data;
    const attachedMenus = mail.payload.parts.filter(part => part.mimeType == MENU_MIMETYPE);
    
    if (attachedMenus.length == 0)
    {
        throw new Error("No menus found");
    }       

    let menu = attachedMenus[attachedMenus.length - 1];
    const menuAttachment = await gmail.users.messages.attachments.get({ userId: 'me', messageId: mail.id, id: menu.body.attachmentId });

    const buffer = Buffer.from(menuAttachment.data.data, 'base64');
    await fs.writeFile(`./${menu.filename}`, buffer);

    console.log(`downloaded file to ./${menu.filename}`)

    return `./${menu.filename}`;
}

(async () => {
    const menu = process.argv.length < 3 ? await GetMenu() : process.argv[2];
    const parsed = await ParseDiningMenu(menu);
    const uniqueMessItems = FindUniqueItems(parsed);
    if (process.argv.length < 3) fs.rm(menu);
    const prisma = new PrismaClient();

    const existingItems = await prisma.messItem.findMany({
        where: {
            name: {
                in: uniqueMessItems.map(item => item.name)
            }
        },
    });

    const execDate = new Date();

    await prisma.messItem.updateMany({
        data: {
            count: {increment: 1},
            lastSeen: execDate,
        },
        where: {
            name: {
                in: existingItems.map(item => item.name)
            }
        }
    });

    const newItems = uniqueMessItems.filter(item => !existingItems.some(existing => existing.name == item.name));

    await prisma.messItem.createMany({
        data: newItems.map(item => ({name: item.name, count: 1, lastSeen: execDate})),
        skipDuplicates: true,
    });

    for (let i = 0, date = parsed.start; i < 7; i++, date.setDate(date.getDate() + 1))
    {
        const bfItems = (await prisma.messItem.findMany({
            where: {
                name: {
                    in: parsed.days[i].Breakfast.map(item => item.name)
                }
            }
        })).map(item => ({id: item.id}));

        const lnItems = (await prisma.messItem.findMany({
            where: {
                name: {
                    in: parsed.days[i].Lunch.map(item => item.name)
                }
            }
        })).map(item => ({id: item.id}));

        const snItems = (await prisma.messItem.findMany({
            where: {
                name: {
                    in: parsed.days[i].Snacks.map(item => item.name)
                }
            }
        })).map(item => ({id: item.id}));

        const dnItems = (await prisma.messItem.findMany({
            where: {
                name: {
                    in: parsed.days[i].Dinner.map(item => item.name)
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
        })
    }
})();