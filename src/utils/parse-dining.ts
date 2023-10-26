import xl from "exceljs";
import { writeFile } from "fs/promises";
import { argv } from "process";
import { start } from "repl";

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

// Check (using format specific indicators) whether the sheet is a menu sheet. This should be the case unless they decide to randomly change the format
// again, in which case we refuse to parse potentially incorrect data.
function isMenuSheet(menu: xl.Worksheet) {
    const [day, date] = [menu.getCell(1, 1), menu.getCell(2, 1)]
    const [bfast, lunch, snacks, dinner] = [menu.getCell(3, 1), menu.getCell(19, 1), menu.getCell(32, 1), menu.getCell(37, 1)]

    if (day.value.toString().trim() != "DAY" || date.value.toString().trim() != "DATE") return false;
    if (bfast.value.toString().split(" ")[0].trim() != "BREAKFAST") return false;
    if (lunch.value.toString().split(" ")[0].trim() != "LUNCH") return false;
    if (snacks.value.toString().split(" ")[0].trim() != "SNACKS") return false;
    if (dinner.value.toString().split(" ")[0].trim() != "DINNER") return false;

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
            throw new Error("Sheet is not a menu sheet");
        }

        const meals: {[k in Meal]: xl.CellValue[][]} = {
            Breakfast: menu.getRows(4, 15).map(row => row.values) as xl.CellValue[][],
            Lunch: menu.getRows(20, 12).map(row => row.values) as xl.CellValue[][],
            Snacks: menu.getRows(33, 4).map(row => row.values) as xl.CellValue[][],
            Dinner: menu.getRows(38, 11).map(row => row.values) as xl.CellValue[][]
        }
    
        let startTimestamp;

        let dateCell = menu.getCell(2, 2);

        if (typeof dateCell.value == "object") {
            startTimestamp = (dateCell.value as Date).getTime();
        } else {
            let firstDate = menu.getCell(2, 2).value as string;
            firstDate = firstDate.trim().replace(/(\d)((rd)|(st)|(th)|(nd))/g, "$1");
            firstDate = /(\d{1,2})-?([A-Za-z]+)/.exec(firstDate).slice(1, 3).join("-") + ` ${year}`;
            startTimestamp = Date.parse(firstDate);
        }
        
        if (Number.isNaN(startTimestamp))
        {
            throw new Error("Invalid date");
        }

        const startDate = new Date(startTimestamp);
        console.log(startDate.toDateString());
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
                    let name: string = "";
                    const thing = row[i + 2];

                    if (typeof thing == "object") {
                        if ("richText" in thing) {
                            name = thing.richText.map(t => t.text).join("");
                        }
                    } else if (typeof thing == "string") {
                        name = thing;
                    }
    
                    if (name.length > 0 && !exclude.includes(name))
                    {
                        const split = name.replace(/\(.*?\)/g, "").split(",").flatMap(s => s.split("/")).map(s => s.trim()).filter(s => s.length > 0 && !exclude.includes(name)).map(item => ({
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
    ParseDiningMenu(argv[2], new Date().getFullYear()).then(async (thing) => {
        await writeFile("menu.json", JSON.stringify(thing, null, 4));
    });
}