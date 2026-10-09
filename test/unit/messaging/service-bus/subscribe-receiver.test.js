const { subscribeReceiver } = require('../../../../app/messaging/service-bus/subscribe-receiver')

describe('subscribeReceiver', () => {
  let receiver
  let action
  let errorHandler

  beforeEach(() => {
    receiver = {
      subscribe: jest.fn()
    }
    action = jest.fn().mockResolvedValue()
    errorHandler = jest.fn()
  })

  test('subscribes with wrapped action and error handler', async () => {
    const config = {}

    await subscribeReceiver(receiver, action, errorHandler, config)

    expect(receiver.subscribe).toHaveBeenCalledWith({
      processMessage: expect.any(Function),
      processError: errorHandler
    }, {
      autoCompleteMessages: false,
      maxConcurrentCalls: 1
    })
  })

  test('wrapped action passes receiver to action', async () => {
    const config = {}
    const message = { body: { id: 1 } }

    await subscribeReceiver(receiver, action, errorHandler, config)
    const wrappedAction = receiver.subscribe.mock.calls[0][0].processMessage

    await wrappedAction(message)

    expect(action).toHaveBeenCalledWith(message, receiver)
  })

  test('uses config values for autoCompleteMessages and maxConcurrentCalls', async () => {
    const config = {
      autoCompleteMessages: true,
      maxConcurrentCalls: 5
    }

    await subscribeReceiver(receiver, action, errorHandler, config)

    expect(receiver.subscribe).toHaveBeenCalledWith(expect.any(Object), {
      autoCompleteMessages: true,
      maxConcurrentCalls: 5
    })
  })
})
