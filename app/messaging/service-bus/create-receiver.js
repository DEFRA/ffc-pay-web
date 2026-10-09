const createReceiver = (sbClient, config) => {
  switch (config.type) {
    case 'subscription':
      return sbClient.createReceiver(config.topic, config.address)
    case 'queue':
      return sbClient.createReceiver(config.address)
    default:
      throw new Error(`Unsupported receiver type: ${config.type}`)
  }
}

module.exports = { createReceiver }
