const { createServiceBusClient } = require('./create-service-bus-client')

const createSessionReceiver = async (sbClient, config, sessionId) => {
  const type = config.type ?? 'queue'

  if (type === 'subscription') {
    return sbClient.acceptSession(config.topic, config.address, sessionId)
  }

  if (type === 'queue') {
    return sbClient.acceptSession(config.address, sessionId)
  }

  throw new Error(`Unsupported receiver type: ${type}`)
}

const getReceiver = (config) => {
  const sbClient = createServiceBusClient(config)
  let sessionReceiver

  return {
    acceptSession: async (sessionId) => {
      sessionReceiver = await createSessionReceiver(sbClient, config, sessionId)
    },
    receiveMessages: async (maxMessageCount, options) => {
      return sessionReceiver.receiveMessages(maxMessageCount, options)
    },
    completeMessage: async (message) => {
      return sessionReceiver.completeMessage(message)
    },
    closeConnection: async () => {
      if (sessionReceiver) {
        await sessionReceiver.close()
      }
      await sbClient.close()
    }
  }
}

const receiveMessage = async (receiver, maxMessageCount, options) => {
  return receiver.receiveMessages(maxMessageCount, options)
}

module.exports = {
  getReceiver,
  receiveMessage
}
