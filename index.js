const LanguageProcessor = require('WhatsAppInfoBot/LanguageProcessor.js')
const WhatsappResponder = require('WhatsAppInfoBot/Responder.js')

const metadata = JSON.parse (require("fs").readFileSync("./metadata.json"))
const processor = new LanguageProcessor("./intents/", metadata)
const responser = new WhatsappResponder(processor.output, metadata)

responser.start()