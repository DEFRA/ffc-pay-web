const subscribeReceiver = (receiver, action, errorHandler, config) => {
  const wrappedAction = async (message) => {
    await action(message, receiver)
  }

  receiver.subscribe({
    processMessage: wrappedAction,
    processError: errorHandler
  }, {
    autoCompleteMessages: config.autoCompleteMessages ?? false,
    maxConcurrentCalls: config.maxConcurrentCalls ?? 1
  })
}

module.exports = { subscribeReceiver }
