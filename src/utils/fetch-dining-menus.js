require('dotenv').config()
const fs = require('fs')
const { google } = require('googleapis')
const { tmpdir } = require('os')
const { join } = require('path')

/**
 * Fetches the latest email from the technology ministry gmail account
 * which has the dining menu
 */

const MENU_EMAIL_SUBJECT = 'menu'
const MENU_MIMETYPE = 'sheet'
const COMBO_MIMETYPE = 'officedocument.wordprocessingml.document'

const auth = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
)
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

const fetchLatestDiningMenu = async() => {
	const getAttachment = async(filename, mimetype) => {
		const diningMenu = payload.parts.find(item => (
			item.filename.toLocaleLowerCase().includes(filename.toLocaleLowerCase()) &&
			item.mimeType.includes(mimetype)
		))
		if(!diningMenu) {
			throw new Error('Could not find menu')
		}
		const { data: { data } } = await gmail.users.messages.attachments.get({
			userId: 'me',
			messageId: message.id,
			id: diningMenu.body.attachmentId
		})
		const buffer = Buffer.from(data, 'base64')
		const fullFilename = join(tmpdir(), `${filename}`)
		fs.writeFileSync(fullFilename, buffer)

		console.log('downloaded file to ', fullFilename)

		return fullFilename
	}
	// finds the latest dining menu
	const gmail = google.gmail({ version: "v1", auth })
	const { data: { messages: [message] } } = await gmail.users.messages.list({ userId: 'me', q: `subject:${MENU_EMAIL_SUBJECT}`, maxResults: 1 })
	if(!message) {
		throw new Error('Could not find email')
	}
	const { data: { payload } } = await gmail.users.messages.get({ 
		userId: "me", 
		id: message.id, 
	})
	return {
		messMenuFilename: await getAttachment('menu', MENU_MIMETYPE),
		comboMenuFilename: await getAttachment('combo', COMBO_MIMETYPE)
	}
}
module.exports = {
	fetchLatestDiningMenu
}