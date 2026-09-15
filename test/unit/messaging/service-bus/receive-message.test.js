const { getReceiver, receiveMessage } = require('../../../../app/messaging/service-bus/receive-message')
const { createServiceBusClient } = require('../../../../app/messaging/service-bus/create-service-bus-client')

jest.mock('../../../../app/messaging/service-bus/create-service-bus-client')

describe('getReceiver', () => {
  let mockSessionReceiver
  let mockClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockSessionReceiver = {
      receiveMessages: jest.fn(),
      completeMessage: jest.fn(),
      close: jest.fn().mockResolvedValue()
    }
    mockClient = {
      acceptSession: jest.fn().mockResolvedValue(mockSessionReceiver),
      close: jest.fn().mockResolvedValue()
    }
    createServiceBusClient.mockReturnValue(mockClient)
  })

  test('creates queue session receiver by default', async () => {
    const config = { address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)

    await receiver.acceptSession('session-id')

    expect(createServiceBusClient).toHaveBeenCalledWith(config)
    expect(mockClient.acceptSession).toHaveBeenCalledWith('my-queue', 'session-id')
  })

  test('creates queue session receiver when type is queue', async () => {
    const config = { type: 'queue', address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)

    await receiver.acceptSession('session-id')

    expect(mockClient.acceptSession).toHaveBeenCalledWith('my-queue', 'session-id')
  })

  test('creates subscription session receiver', async () => {
    const config = {
      type: 'subscription',
      topic: 'my-topic',
      address: 'my-subscription',
      host: 'test.servicebus.windows.net'
    }
    const receiver = getReceiver(config)

    await receiver.acceptSession('session-id')

    expect(mockClient.acceptSession).toHaveBeenCalledWith('my-topic', 'my-subscription', 'session-id')
  })

  test('throws for unsupported receiver type', async () => {
    const config = { type: 'topic', address: 'my-topic', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)

    await expect(receiver.acceptSession('session-id')).rejects.toThrow('Unsupported receiver type: topic')
  })

  test('receives messages from session receiver', async () => {
    const config = { type: 'queue', address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)
    await receiver.acceptSession('session-id')
    const messages = [{ body: 'test' }]
    mockSessionReceiver.receiveMessages.mockResolvedValue(messages)

    const result = await receiveMessage(receiver, 1, { maxWaitTimeInMs: 50000 })

    expect(mockSessionReceiver.receiveMessages).toHaveBeenCalledWith(1, { maxWaitTimeInMs: 50000 })
    expect(result).toEqual(messages)
  })

  test('completes message on session receiver', async () => {
    const config = { type: 'queue', address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)
    await receiver.acceptSession('session-id')
    const message = { body: 'test' }

    await receiver.completeMessage(message)

    expect(mockSessionReceiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('closes session receiver and client', async () => {
    const config = { type: 'queue', address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)
    await receiver.acceptSession('session-id')

    await receiver.closeConnection()

    expect(mockSessionReceiver.close).toHaveBeenCalledTimes(1)
    expect(mockClient.close).toHaveBeenCalledTimes(1)
  })

  test('closes client when session was not accepted', async () => {
    const config = { type: 'queue', address: 'my-queue', host: 'test.servicebus.windows.net' }
    const receiver = getReceiver(config)

    await receiver.closeConnection()

    expect(mockSessionReceiver.close).not.toHaveBeenCalled()
    expect(mockClient.close).toHaveBeenCalledTimes(1)
  })
})
