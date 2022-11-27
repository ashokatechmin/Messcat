const { createLanguageProcessor } = require('@adiwajshing/whatsapp-info-bot')
const { default: helpIntent } = require('@adiwajshing/whatsapp-info-bot/dist/example/intents/help')

const create = async() => {
	const intents = [
		await require('./meals')(),
		await require("./shuttle")(),
		
		require('./f_all.json'),
		require('./gratefulness.json'),
		require('./greeting.json'),
		require('./helpline.json'),
		require('./timings.json'),
	]
	// const credsIntent = require('./messcat-secrets/creds.json')
	// if(credsIntent) intents.push(credsIntent)
	// else console.log('could not find creds intent')

	intents.push(
		helpIntent(intents)
	)
	return createLanguageProcessor(
		intents,
		{
			parsingFailedText: "Sorry fren, I couldn't understand '{{input}}'. Type 'help' to know what all I can do"
		}
	)
}
module.exports = create()