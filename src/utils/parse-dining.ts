import xl from "exceljs";
import { argv } from "process";

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

// Check (using format specific indicators) whether the sheet is a menu sheet. This should be the case unless they decide to randomly change the format again, in which case we refuse to parse potentially incorrect data.
function isMenuSheet(menu: xl.Worksheet) {
    const first = menu.getCell(1, 1);
    const [day, date] = [menu.getCell(2, 1), menu.getCell(3, 1)]

    if (!first.isMerged) return false;
    if (day.value.toString().trim() != "DAY" || date.value.toString().trim() != "DATE") return false;
    
    return true;
}

async function ParseXlsx(path: string, year: number): Promise<MessMenu[]>
{
    const res: MessMenu[] = [];
    const wb = new xl.Workbook();
    await wb.xlsx.readFile(path);

    wb.worksheets.forEach(menu => {
        if (!isMenuSheet(menu))
        {
            console.error("Sheet is not a menu sheet");
            return;
        }

        const meals: {[k in Meal]: xl.CellValue[][]} = {
            Breakfast: menu.getRows(5, 12).map(row => row.values) as xl.CellValue[][],
            Lunch: menu.getRows(18, 12).map(row => row.values) as xl.CellValue[][],
            Snacks: menu.getRows(31, 4).map(row => row.values) as xl.CellValue[][],
            Dinner: menu.getRows(36, 10).map(row => row.values) as xl.CellValue[][]
        }
    
        const firstDate = menu.getCell(3, 2).value as string;
        const startString = firstDate.trim().replace(/(\d)((rd)|(st)|(th)|(nd))/g, "$1") + ` ${year}`;
        const startDate = new Date(Date.parse(startString));
        startDate.setFullYear(new Date().getFullYear());
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6)
        
        if (endDate.getFullYear() !== startDate.getFullYear())
            startDate.setFullYear(startDate.getFullYear() - 1);
    
        const days: MessMenu["days"] =  Array.from(new Array(7), (_, i) => ({
            Breakfast: [],
            Lunch: [],
            Snacks: [],
            Dinner: []
        }));
    
        const exclude = ["-"];

        Object.keys(meals).forEach(meal => {
            const key = meal as Meal;
    
            meals[key].forEach((row) => {
                for (let i = 0; i < 7; i++)
                {
                    const name = (row[i + 2] as string ?? "").trim();
    
                    if (name.length > 0 && !exclude.includes(name))
                    {
                        const split = name.split(",").flatMap(s => s.split("/")).map(s => s.trim()).filter(s => s.length > 0 && !exclude.includes(name)).map(s => s.split("(")[0].trim()).map(item => ({
                            category: row[1] as string,
                            name: item,
                            meal: key
                        }));
    
                        days[i][key].push(...split);
                    }
                }
            });
        });

        res.push({
            start: startDate,
            end: endDate,
            days: days
        });
    });

    return res;
}

export function FindUniqueItemsWithCounts(menu: MessMenu): Map<string, number>
{
    const items = new Array<MessItem>();
    const counts = new Map<string, number>();

    menu.days.forEach(day => {
        Object.keys(day).forEach(meal => {
            day[meal as Meal].forEach(item => {
                counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
                if (items.findIndex(i => i.name === item.name) === -1)
                {
                    items.push(item);
                }
            });
        });
    });

    return new Map(items.map(item => [item.name, counts.get(item.name) ?? 0]));
}

export default async function ParseDiningMenu(path: string, year: number) 
{
    if (path.endsWith(".xlsx"))
    {
        return await ParseXlsx(path, year);
    }
}

if (argv.length >= 3) {
    ParseDiningMenu(argv[2], new Date().getFullYear()).then((thing) => {
        console.log(JSON.stringify(thing));        
    });
}