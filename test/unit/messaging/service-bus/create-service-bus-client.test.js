const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

const { createServiceBusClient } = require('../../../../app/messaging/service-bus/create-service-bus-client')

jest.mock('@azure/service-bus')
jest.mock('@azure/identity')

describe('createServiceBusClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates client from connection string', () => {
    const config = { connectionString: 'test-connection-string' }

    createServiceBusClient(config)

    expect(ServiceBusClient).toHaveBeenCalledWith('test-connection-string', undefined)
  })

  test('creates client using default credential chain', () => {
    const credential = { name: 'default-credential' }
    DefaultAzureCredential.mockImplementation(() => credential)

    const config = { host: 'test.servicebus.windows.net', useCredentialChain: true }

    createServiceBusClient(config)

    expect(DefaultAzureCredential).toHaveBeenCalledWith()
    expect(ServiceBusClient).toHaveBeenCalledWith('test.servicebus.windows.net', credential, undefined)
  })

  test('creates client using managed identity client id', () => {
    const credential = { name: 'managed-identity-credential' }
    DefaultAzureCredential.mockImplementation(() => credential)

    const config = {
      host: 'test.servicebus.windows.net',
      useCredentialChain: true,
      managedIdentityClientId: 'managed-client-id'
    }

    createServiceBusClient(config)

    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: 'managed-client-id' })
    expect(ServiceBusClient).toHaveBeenCalledWith('test.servicebus.windows.net', credential, undefined)
  })

  test('creates client from shared access signature', () => {
    const config = {
      host: 'test.servicebus.windows.net',
      username: 'RootManageSharedAccessKey',
      password: 'test-key'
    }

    createServiceBusClient(config)

    expect(ServiceBusClient).toHaveBeenCalledWith(
      'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=test-key',
      undefined
    )
  })

  test('appends emulator flag when useEmulator is true', () => {
    const config = {
      host: 'test.servicebus.windows.net',
      username: 'RootManageSharedAccessKey',
      password: 'test-key',
      useEmulator: true
    }

    createServiceBusClient(config)

    expect(ServiceBusClient).toHaveBeenCalledWith(
      'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=test-key;UseDevelopmentEmulator=true',
      undefined
    )
  })

  test('passes retry options to client', () => {
    const config = {
      connectionString: 'test-connection-string',
      maxRetries: 5,
      retryDelayInMs: 500,
      maxRetryDelayInMs: 30000,
      retryMode: 'Exponential'
    }

    createServiceBusClient(config)

    expect(ServiceBusClient).toHaveBeenCalledWith('test-connection-string', {
      retryOptions: {
        maxRetries: 5,
        retryDelayInMs: 500,
        maxRetryDelayInMs: 30000,
        retryMode: 'Exponential'
      }
    })
  })

  test('strips null or undefined retry options so SDK defaults are used', () => {
    const config = {
      connectionString: 'test-connection-string',
      maxRetries: 5,
      retryDelayInMs: null,
      maxRetryDelayInMs: undefined,
      retryMode: 'Fixed'
    }

    createServiceBusClient(config)

    expect(ServiceBusClient).toHaveBeenCalledWith('test-connection-string', {
      retryOptions: {
        maxRetries: 5,
        retryMode: 'Fixed'
      }
    })
  })
})
