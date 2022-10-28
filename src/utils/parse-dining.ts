import { readFile } from "fs/promises";
import pdf from "pdf-parse"

async function ParsePDF(path: string)
{
    const data = await readFile(path);
    const doc = await pdf(data);

    console.log(doc.info);
    console.log(doc.text);
}

async function ParseXlsx(path: string)
{

}

export default async function ParseDiningMenu(path: string) 
{
    if (path.endsWith(".pdf"))
    {
        return await ParsePDF(path);
    }
    else if (path.endsWith(".xlsx"))
    {
        return await ParseXlsx(path);
    }
}

if (process.argv.length >= 3)
{
    ParseDiningMenu(process.argv[2]);
}