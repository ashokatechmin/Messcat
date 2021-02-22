const { createLanguageProcessor } = require('@adiwajshing/whatsapp-info-bot')
const { default: helpIntent } = require('@adiwajshing/whatsapp-info-bot/dist/example/intents/help')

const create = async() => {
	const intents = [
		await require('./corona')(),
		new (require('./meals'))(),
		
		require('./f_all.json'),
		require('./gratefulness.json'),
		require('./greeting.json'),
		require('./helpline.json'),
		require('./timings.json'),
	]
	intents.push(
		helpIntent(intents)
	)
	return createLanguageProcessor(
		intents,
		{
			parsingFailedText: "Sorry fren, I couldn't understand '<input>'. Type 'help' to know what all I can do"
		}
	)
}
module.exports = create()