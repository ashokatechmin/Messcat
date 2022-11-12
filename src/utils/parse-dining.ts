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
    
    const meals: {[k in Meal]: xl.CellValue[][]} = {
        Breakfast: menu.getRows(4, 8).map(row => row.values) as xl.CellValue[][],
        Lunch: menu.getRows(13, 8).map(row => row.values) as xl.CellValue[][],
        Snacks: menu.getRows(22, 5).map(row => row.values) as xl.CellValue[][],
        Dinner: menu.getRows(28, 8).map(row => row.values) as xl.CellValue[][]
    }

    const title = menu.getCell(1, 1).value as string;
    const startString = title.trim().split('(')[1].split('-')[0].trim().replace(/(rd)|(st)|(th)|(nd)/g, "") + ` ${ new Date().getFullYear()}`;
    const startDate = new Date(Date.parse(startString));
    startDate.setFullYear(new Date().getFullYear());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6)

    const days: MessMenu["days"] =  Array.from(new Array(7), (_, i) => ({
        Breakfast: [],
        Lunch: [],
        Snacks: [],
        Dinner: []
    }));

    Object.keys(meals).forEach(meal => {
        const key = meal as Meal;

        meals[key].forEach((row) => {
            for (let i = 0; i < 7; i++)
            {
                const name = row[i + 3] as string ?? "";

                if (name.length > 0)
                {
                    const split = name.split(",").map(s => s.trim()).filter(s => s.length > 0).map(s => s.split("(")[0].trim()).map(item => ({
                        category: row[2] as string,
                        name: item,
                        meal: key
                    }));

                    days[i][key].push(...split);
                }
            }
        });
    });

    const res: MessMenu = {
        start: startDate,
        end: endDate,
        days: days
    };

    return res;
}

export function FindUniqueItems(menu: MessMenu): MessItem[]
{
    const items = new Array<MessItem>();

    menu.days.forEach(day => {
        Object.keys(day).forEach(meal => {
            day[meal as Meal].forEach(item => {
                if (items.findIndex(i => i.name === item.name) === -1)
                {
                    items.push(item);
                }
            });
        });
    });

    return items;
}

export default async function ParseDiningMenu(path: string) 
{
    if (path.endsWith(".xlsx"))
    {
        return await ParseXlsx(path);
    }
}