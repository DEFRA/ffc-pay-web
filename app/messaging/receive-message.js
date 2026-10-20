const { getReceiver, receiveMessage: receiveServiceBusMessage } = require('./service-bus')

const receiveMessage = async (messageId, config) => {
  let result
  const receiver = getReceiver(config)
  await receiver.acceptSession(messageId)
  const messages = await receiveServiceBusMessage(receiver, 1, { maxWaitTimeInMs: 50000 })
  if (messages.length) {
    result = messages[0].body
    await receiver.completeMessage(messages[0])
  }
  await receiver.closeConnection()
  return result
}

module.exports = {
  receiveMessage
}
