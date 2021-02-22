const LanguageProcessor = require('./intents')
const { createSendMammyResponder } = require('@adiwajshing/whatsapp-info-bot')

const hook = async(event) => {
  const responder = createSendMammyResponder(
    await LanguageProcessor,
    {
      delayMessage: 'Apologies for the delay in responding',
      minimumDelayTriggerS: 120,
      refreshToken: process.env.SENDMAMMY_REFRESH_TOKEN
    }
  )
  return responder(event)
}
module.exports.hook = hook