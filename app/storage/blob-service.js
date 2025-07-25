const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../config').storageConfig

const createBlobServiceClient = (connectionString, storageAccount, managedIdentityClientId) =>
  config.useConnectionStr
    ? (console.log('Using connection string for BlobServiceClient'),
      BlobServiceClient.fromConnectionString(connectionString))
    : (console.log('Using DefaultAzureCredential for BlobServiceClient'),
      new BlobServiceClient(`https://${storageAccount}.blob.core.windows.net`, new DefaultAzureCredential({ managedIdentityClientId })))

const payBlobClient = createBlobServiceClient(
  config.payConnectionStr,
  config.payStorageAccount,
  config.managedIdentityClientId
)

const docBlobClient = createBlobServiceClient(
  config.docConnectionStr,
  config.docStorageAccount,
  config.managedIdentityClientId
)

const getPayContainerClient = async (containerName) => {
  const containerClient = payBlobClient.getContainerClient(containerName)

  if (config.createContainers) {
    const { succeeded } = await containerClient.createIfNotExists()
    console.log(`PAY container '${containerName}': ${succeeded ? 'created' : 'already exists'}`)
  }

  return containerClient
}

const getDocContainerClient = async (containerName) => {
  const containerClient = docBlobClient.getContainerClient(containerName)

  if (config.createContainers) {
    await containerClient.createIfNotExists()
  }

  return containerClient
}

module.exports = {
  getPayContainerClient,
  getDocContainerClient
}
