const LanguageProcessor = require('@adiwajshing/whatsapp-info-bot/LanguageProcessor.js')
const WhatsappResponder = require('@adiwajshing/whatsapp-info-bot/Responder.js')

const metadata = JSON.parse (require("fs").readFileSync("./metadata.json"))
const processor = new LanguageProcessor("./intents/", metadata)
const responser = new WhatsappResponder(processor.output, metadata)

responser.start()