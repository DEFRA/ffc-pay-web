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
  config.payManagedIdentityClientId
)

const docsBlobClient = createBlobServiceClient(
  config.docConnectionStr,
  config.docStorageAccount,
  config.docsManagedIdentityClientId
)

const getPayContainerClient = async (containerName) => {
  const containerClient = payBlobClient.getContainerClient(containerName)

  if (config.createContainers) {
    const { succeeded } = await containerClient.createIfNotExists()
    console.log(`PAY container '${containerName}': ${succeeded ? 'created' : 'already exists'}`)
  }

  return containerClient
}

const getDocsContainerClient = async (containerName) => {
  const containerClient = docsBlobClient.getContainerClient(containerName)

  if (config.createContainers) {
    const { succeeded } = await containerClient.createIfNotExists()
    console.log(`DOCS container '${containerName}': ${succeeded ? 'created' : 'already exists'}`)
  }

  return containerClient
}

module.exports = {
  getPayContainerClient,
  getDocsContainerClient
}
