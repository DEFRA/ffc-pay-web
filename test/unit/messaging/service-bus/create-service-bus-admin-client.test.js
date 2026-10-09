const { ServiceBusAdministrationClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

const { createServiceBusAdministrationClient } = require('../../../../app/messaging/service-bus/create-service-bus-admin-client')

jest.mock('@azure/service-bus')
jest.mock('@azure/identity')

describe('createServiceBusAdministrationClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates admin client from connection string', () => {
    const config = { connectionString: 'test-connection-string' }

    createServiceBusAdministrationClient(config)

    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test-connection-string')
  })

  test('creates admin client using default credential chain', () => {
    const credential = { name: 'default-credential' }
    DefaultAzureCredential.mockImplementation(() => credential)

    const config = { host: 'test.servicebus.windows.net', useCredentialChain: true }

    createServiceBusAdministrationClient(config)

    expect(DefaultAzureCredential).toHaveBeenCalledWith()
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test.servicebus.windows.net', credential)
  })

  test('creates admin client using managed identity client id', () => {
    const credential = { name: 'managed-identity-credential' }
    DefaultAzureCredential.mockImplementation(() => credential)

    const config = {
      host: 'test.servicebus.windows.net',
      useCredentialChain: true,
      managedIdentityClientId: 'managed-client-id'
    }

    createServiceBusAdministrationClient(config)

    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: 'managed-client-id' })
    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith('test.servicebus.windows.net', credential)
  })

  test('creates admin client from shared access signature', () => {
    const config = {
      host: 'test.servicebus.windows.net',
      username: 'RootManageSharedAccessKey',
      password: 'test-key'
    }

    createServiceBusAdministrationClient(config)

    expect(ServiceBusAdministrationClient).toHaveBeenCalledWith(
      'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=test-key'
    )
  })
})
