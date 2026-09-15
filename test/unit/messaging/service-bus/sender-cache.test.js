const { getSender, closeSenders, clearCache } = require('../../../../app/messaging/service-bus/sender-cache')
const { createServiceBusClient } = require('../../../../app/messaging/service-bus/create-service-bus-client')

jest.mock('../../../../app/messaging/service-bus/create-service-bus-client')

describe('sender-cache', () => {
  let mockClient
  let mockSender

  beforeEach(() => {
    jest.clearAllMocks()
    clearCache()

    mockSender = {
      close: jest.fn().mockResolvedValue()
    }
    mockClient = {
      createSender: jest.fn().mockReturnValue(mockSender),
      close: jest.fn().mockResolvedValue()
    }

    createServiceBusClient.mockReturnValue(mockClient)
  })

  test('creates one client per namespace', () => {
    const configA = { host: 'namespace-a.servicebus.windows.net', address: 'topic-a' }
    const configB = { host: 'namespace-a.servicebus.windows.net', address: 'topic-b' }

    getSender(configA)
    getSender(configB)

    expect(createServiceBusClient).toHaveBeenCalledTimes(1)
    expect(createServiceBusClient).toHaveBeenCalledWith(configA)
  })

  test('creates one sender per address', () => {
    const configA = { host: 'namespace.servicebus.windows.net', address: 'topic-a' }
    const configB = { host: 'namespace.servicebus.windows.net', address: 'topic-b' }

    getSender(configA)
    getSender(configB)

    expect(mockClient.createSender).toHaveBeenCalledTimes(2)
    expect(mockClient.createSender).toHaveBeenCalledWith('topic-a')
    expect(mockClient.createSender).toHaveBeenCalledWith('topic-b')
  })

  test('reuses sender when same address requested', () => {
    const config = { host: 'namespace.servicebus.windows.net', address: 'topic-a' }

    const sender1 = getSender(config)
    const sender2 = getSender(config)

    expect(sender1).toBe(sender2)
    expect(mockClient.createSender).toHaveBeenCalledTimes(1)
  })

  test('closeSenders closes senders and clients', async () => {
    const config = { host: 'namespace.servicebus.windows.net', address: 'topic-a' }
    getSender(config)

    await closeSenders()

    expect(mockSender.close).toHaveBeenCalledTimes(1)
    expect(mockClient.close).toHaveBeenCalledTimes(1)
  })

  test('closeSenders logs errors and continues closing', async () => {
    const config = { host: 'namespace.servicebus.windows.net', address: 'topic-a' }
    getSender(config)

    mockSender.close.mockRejectedValue(new Error('sender close failed'))
    mockClient.close.mockRejectedValue(new Error('client close failed'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await closeSenders()

    expect(consoleSpy).toHaveBeenCalledWith('Error closing sender:', expect.any(Error))
    expect(consoleSpy).toHaveBeenCalledWith('Error closing Service Bus client:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
