require('dotenv').config()
const fs = require('fs')
const { google } = require('googleapis')
const { tmpdir } = require('os')
const { join } = require('path')

const auth = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
)
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

const fetchLatestDiningMenu = async() => {
	const getPdf = async(filename) => {
		const diningMenu = pdfs.find(item => (
			item.filename.toLocaleLowerCase().includes(filename.toLocaleLowerCase())
		))
		const { data: { data } } = await gmail.users.messages.attachments.get({
			userId: 'me',
			messageId: message.id,
			id: diningMenu.body.attachmentId
		})
		const buffer = Buffer.from(data, 'base64')
		const fullFilename = join(tmpdir(), `${filename}.pdf`)
		fs.writeFileSync(fullFilename, buffer)

		return fullFilename
	}
	// finds the latest dining menu
	const gmail = google.gmail({ version: "v1", auth })
	const { data: { messages: [message] } } = await gmail.users.messages.list({ userId: 'me', q: 'subject:Dining', maxResults: 1 })
	if(!message) {
		throw new Error('Could not find email')
	}

	const { data: { payload } } = await gmail.users.messages.get({ 
		userId: "me", 
		id: message.id, 
	})

	const pdfs = payload.parts.filter(part => part.mimeType === "application/pdf")
	const diningMenu = pdfs.find(item => item.filename.includes('Ashoka Dining Menu'))
	
	const { data: { data } } = await gmail.users.messages.attachments.get({
		userId: 'me',
		messageId: message.id,
		id: diningMenu.body.attachmentId
	})
	const buffer = Buffer.from(data, 'base64')
	const filename = join(tmpdir(), 'dining-menu.pdf')
	fs.writeFileSync(filename, buffer)

	return {
		messMenuFilename: await getPdf('Ashoka Dining Menu')
	}
}
module.exports = {
	fetchLatestDiningMenu
}