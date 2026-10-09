const { getSender, sendMessage: sendServiceBusMessage } = require('./service-bus')
const { createMessage } = require('./create-message')

const sendMessage = async (body, type, config, options) => {
  const sender = getSender(config)
  const message = createMessage(body, type, options)
  await sendServiceBusMessage(sender, message)
}

module.exports = {
  sendMessage
}
