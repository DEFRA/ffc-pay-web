const messageSchema = require('./message-schema')
const { enrichMessage } = require('./enrich-message')

const sendMessage = async (sender, message, options) => {
  await messageSchema.validateAsync(message, { allowUnknown: true })
  const enrichedMessage = enrichMessage(message)
  await sender.sendMessages(enrichedMessage, options)
}

module.exports = { sendMessage }
