const { sendBatchMessages } = require('../../../../app/messaging/service-bus/send-batch-messages')
const messageSchema = require('../../../../app/messaging/service-bus/message-schema')

jest.mock('../../../../app/messaging/service-bus/message-schema', () => ({
  validateAsync: jest.fn()
}))

describe('sendBatchMessages', () => {
  let sender
  let batch

  beforeEach(() => {
    jest.clearAllMocks()
    batch = {
      count: 0,
      tryAddMessage: jest.fn().mockImplementation(() => {
        batch.count += 1
        return true
      })
    }
    sender = {
      createMessageBatch: jest.fn().mockImplementation(() => {
        batch.count = 0
        return Promise.resolve(batch)
      }),
      sendMessages: jest.fn().mockResolvedValue()
    }
    messageSchema.validateAsync.mockResolvedValue()
  })

  test('adds all messages to one batch and sends it', async () => {
    const messages = [
      { body: { id: 1 }, type: 'type-1', source: 'source' },
      { body: { id: 2 }, type: 'type-2', source: 'source' }
    ]

    await sendBatchMessages(sender, messages)

    expect(sender.createMessageBatch).toHaveBeenCalledTimes(1)
    expect(batch.tryAddMessage).toHaveBeenCalledTimes(2)
    expect(sender.sendMessages).toHaveBeenCalledTimes(1)
    expect(sender.sendMessages).toHaveBeenCalledWith(batch, undefined)
  })

  test('flushes full batch and starts a new one', async () => {
    const tryAddResults = [true, false, true]
    batch.tryAddMessage.mockImplementation(() => {
      const result = tryAddResults.shift()
      if (result) {
        batch.count += 1
      }
      return result
    })

    const messages = [
      { body: { id: 1 }, type: 'type-1', source: 'source' },
      { body: { id: 2 }, type: 'type-2', source: 'source' }
    ]

    await sendBatchMessages(sender, messages)

    expect(sender.createMessageBatch).toHaveBeenCalledTimes(2)
    expect(sender.sendMessages).toHaveBeenCalledTimes(2)
  })

  test('throws if a single message is too large for an empty batch', async () => {
    batch.tryAddMessage.mockReturnValue(false)

    const messages = [
      { body: { id: 1 }, type: 'type-1', source: 'source' }
    ]

    await expect(sendBatchMessages(sender, messages)).rejects.toThrow('Message too big to fit in a batch')
    expect(sender.sendMessages).not.toHaveBeenCalled()
  })

  test('passes send options through', async () => {
    const messages = [
      { body: { id: 1 }, type: 'type-1', source: 'source' }
    ]
    const options = { transactionId: 'abc' }

    await sendBatchMessages(sender, messages, options)

    expect(sender.sendMessages).toHaveBeenCalledWith(batch, options)
  })
})
