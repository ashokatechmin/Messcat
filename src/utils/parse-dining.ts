import { readFile } from "fs/promises";
import xl from "exceljs";

type MessMenu = {
    start: Date,
    end: Date,
    days: {breakfast: string, lunch: string, dinner: string}[]
}

async function ParseXlsx(path: string): Promise<MessMenu>
{
    const wb = new xl.Workbook();
    await wb.xlsx.readFile(path);

    const menu = wb.worksheets[0];
    const title = menu.name;

    menu.eachRow((row, n) => {
        if (n < 4) return;
        if (row.hasValues) console.log(row.values);
    });

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