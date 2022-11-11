import xl from "exceljs";

type Meal = "Breakfast" | "Lunch" | "Snacks" | "Dinner";

type MessItem = {
    name: string,
    meal: Meal,
    category: string
}

type MessMenu = {
    start: Date,
    end: Date,
    days: {[k in Meal]: MessItem[]}[]
}

async function ParseXlsx(path: string): Promise<MessMenu>
{
    const wb = new xl.Workbook();
    await wb.xlsx.readFile(path);

    const menu = wb.worksheets[0];
    const title = menu.name;

    const bfast = menu.getRows(4, 7).map(row => row.values), lunch = menu.getRows(13, 7).map(row => row.values), snacks = menu.getRows(22, 4).map(row => row.values), dinner = menu.getRows(28, 7).map(row => row.values);

    const startString = title.split("Menu ")[1].split("-")[0].trim().replace(/(th)|(st)|(rd)/g, "");
    const startDate = new Date(Date.parse(startString));
    startDate.setFullYear(new Date().getFullYear());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6)

    return {
        start: startDate,
        end: endDate,
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