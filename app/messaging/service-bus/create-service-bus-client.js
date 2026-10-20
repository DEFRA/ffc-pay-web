const { ServiceBusClient } = require('@azure/service-bus')
const { DefaultAzureCredential } = require('@azure/identity')

const buildConnectionString = (config) => {
  let connectionString = `Endpoint=sb://${config.host}/;SharedAccessKeyName=${config.username};SharedAccessKey=${config.password}`

  if (config.useEmulator) {
    connectionString += ';UseDevelopmentEmulator=true'
  }

  return connectionString
}

const getCredentials = (config) => {
  if (config.managedIdentityClientId) {
    return new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId })
  }

  return new DefaultAzureCredential()
}

const buildRetryOptions = (config) => {
  const retryOptions = {}

  if (config.maxRetries != null) {
    retryOptions.maxRetries = config.maxRetries
  }
  if (config.retryDelayInMs != null) {
    retryOptions.retryDelayInMs = config.retryDelayInMs
  }
  if (config.maxRetryDelayInMs != null) {
    retryOptions.maxRetryDelayInMs = config.maxRetryDelayInMs
  }
  if (config.retryMode != null) {
    retryOptions.retryMode = config.retryMode
  }

  return Object.keys(retryOptions).length ? retryOptions : undefined
}

const createServiceBusClient = (config) => {
  const retryOptions = buildRetryOptions(config)
  const clientOptions = retryOptions ? { retryOptions } : undefined

  if (config.connectionString) {
    return new ServiceBusClient(config.connectionString, clientOptions)
  }

  if (config.useCredentialChain) {
    return new ServiceBusClient(config.host, getCredentials(config), clientOptions)
  }

  return new ServiceBusClient(buildConnectionString(config), clientOptions)
}

module.exports = { createServiceBusClient }
