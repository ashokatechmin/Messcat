const LanguageProcessor = require('./intents')
const { createChatAPI2Responder } = require('@adiwajshing/whatsapp-info-bot')

const responder = LanguageProcessor.then(processor => (
  createChatAPI2Responder(
    processor,
    {
      delayMessage: 'Apologies for the delay in responding',
      minimumDelayTriggerS: 120,
      refreshToken: process.env.SENDMAMMY_REFRESH_TOKEN,
      apiUrl: "https://apvbymr0a8.execute-api.ap-east-1.amazonaws.com/v2"
    }
  )
))

module.exports.hook = async (event) => (await responder).handler(event)