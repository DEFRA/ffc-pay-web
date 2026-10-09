const { ServiceBusAdministrationClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

const getCredentials = (config) => {
  if (config.managedIdentityClientId) {
    return new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId })
  }

  return new DefaultAzureCredential()
}

const createServiceBusAdministrationClient = (config) => {
  if (config.connectionString) {
    return new ServiceBusAdministrationClient(config.connectionString)
  }

  if (config.useCredentialChain) {
    return new ServiceBusAdministrationClient(config.host, getCredentials(config))
  }

  const connectionString = `Endpoint=sb://${config.host}/;SharedAccessKeyName=${config.username};SharedAccessKey=${config.password}`
  return new ServiceBusAdministrationClient(connectionString)
}

module.exports = { createServiceBusAdministrationClient }
