const enrichMessage = (message) => {
  return {
    ...message,
    applicationProperties: {
      type: message.type,
      source: message.source,
      ...message.metadata
    }
  }
}

module.exports = { enrichMessage }
