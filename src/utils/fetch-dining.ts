import fs from "fs/promises";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
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
    if (process.argv.length >= 3) process.env.MENU_ID = process.argv[2];
    const menu = await GetMenu();
    if (menu == undefined) throw new Error("Menu file not found");
    const parsed = await ParseDiningMenu(menu);
    if (process.argv.length >= 3)
    {
        await fs.rm(menu);
    }

    const uniqueMessItems = FindUniqueItems(parsed);
    const prisma = new PrismaClient();

    const existingItems = await prisma.messItem.findMany({
        where: {
            name: {
                in: uniqueMessItems.map(item => item.name)
            }
        },
    });

    // TODO: Wrap asyncs in try until success

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
        if ((await prisma.dailyMenu.findFirst({where: {date}})) !== undefined)
        {
            throw new Error("Menu already exists for date " + date);
        }

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