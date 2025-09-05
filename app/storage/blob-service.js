const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../config').storageConfig

const createBlobServiceClient = (connectionString, storageAccount, managedIdentityClientId) =>
  config.useConnectionStr
    ? (console.log('Using connection string for BlobServiceClient'),
      BlobServiceClient.fromConnectionString(connectionString))
    : (console.log(`Using DefaultAzureCredential for ${storageAccount} BlobServiceClient`),
      new BlobServiceClient(`https://${storageAccount}.blob.core.windows.net`, new DefaultAzureCredential({ managedIdentityClientId })))

const payEventStoreConnectionStr = createBlobServiceClient(
  config.payEventStoreConnectionStr,
  config.payStorageAccount,
  config.managedIdentityClientId
)

const payInjectionConnectionStr = createBlobServiceClient(
  config.payInjectionConnectionStr,
  config.payStorageAccount,
  config.managedIdentityClientId
)

const docBlobClient = createBlobServiceClient(
  config.docConnectionStr,
  config.docStorageAccount,
  config.managedIdentityClientId
)

const getPayEventStoreContainerClient = async (containerName) => {
  const containerClient = payEventStoreConnectionStr.getContainerClient(containerName)

  if (config.createContainers) {
    await containerClient.createIfNotExists()
  }

  return containerClient
}

const getPayInjectionContainerClient = async (containerName) => {
  const containerClient = payInjectionConnectionStr.getContainerClient(containerName)

  if (config.createContainers) {
    await containerClient.createIfNotExists()
  }

  return containerClient
}

const getDocContainerClient = async (containerName) => {
  console.log(`Getting document container client for ${containerName}`)
  const containerClient = docBlobClient.getContainerClient(containerName)

  if (config.createContainers) {
    await containerClient.createIfNotExists()
  }

  return containerClient
}

module.exports = {
  getPayInjectionContainerClient,
  getPayEventStoreContainerClient,
  getDocContainerClient
}
