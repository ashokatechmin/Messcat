const LanguageProcessor = require('./intents')
const { createSendMammyResponder } = require('@adiwajshing/whatsapp-info-bot')

const responder = LanguageProcessor.then(processor => (
  createSendMammyResponder(
    processor,
    {
      delayMessage: 'Apologies for the delay in responding',
      minimumDelayTriggerS: 120,
      refreshToken: process.env.SENDMAMMY_REFRESH_TOKEN
    }
  )
))

module.exports.hook = async (event) => (await responder)(event)