import fs from "fs/promises";
import { google } from "googleapis";
import { SupabaseClient } from "@supabase/supabase-js";
import ParseDiningMenu from "./parse-dining";

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
    const menu = await GetMenu();
    const parsed = await ParseDiningMenu(menu);
    fs.rm(menu);
    console.log(parsed);
})();