import { readFile } from "fs/promises";
import pdf from "pdf-parse"

type MessMenu = {
    start: Date,
    end: Date,
    days: {breakfast: string, lunch: string, dinner: string}[]
}

async function ParseXlsx(path: string): Promise<MessMenu>
{
    return {
        start: new Date(),
        end: new Date(),
        days: []
    };
}

export default async function ParseDiningMenu(path: string) 
{
    if (path.endsWith(".xlsx"))
    {
        return await ParseXlsx(path);
    }
}

if (process.argv.length >= 3)
{
    ParseDiningMenu(process.argv[2]);
}