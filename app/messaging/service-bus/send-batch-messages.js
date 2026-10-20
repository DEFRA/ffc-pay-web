const messageSchema = require('./message-schema')
const { enrichMessage } = require('./enrich-message')

const sendBatchMessages = async (sender, messages, options) => {
  let batch = await sender.createMessageBatch()

  for (const message of messages) {
    await messageSchema.validateAsync(message, { allowUnknown: true })
    const enrichedMessage = enrichMessage(message)

    if (!batch.tryAddMessage(enrichedMessage)) {
      if (batch.count > 0) {
        await sender.sendMessages(batch, options)
        batch = await sender.createMessageBatch()
      }

      if (!batch.tryAddMessage(enrichedMessage)) {
        throw new Error('Message too big to fit in a batch')
      }
    }
  }

  if (batch.count > 0) {
    await sender.sendMessages(batch, options)
  }
}

module.exports = { sendBatchMessages }
