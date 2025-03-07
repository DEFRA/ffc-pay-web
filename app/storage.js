const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

if (config.useConnectionStr) {
  console.log('Using connection string for BlobServiceClient')
  blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
} else {
  console.log('Using DefaultAzureCredential for BlobServiceClient')
  const uri = `https://${config.storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId }))
}

const projectionContainer = blobServiceClient.getContainerClient(config.projectionContainer)
const reportContainer = blobServiceClient.getContainerClient(config.reportContainer)

const initialiseContainers = async () => {
  if (config.createContainers) {
    console.log('Making sure blob containers exist')
    await projectionContainer.createIfNotExists()
    await reportContainer.createIfNotExists()
  }
  containersInitialised = true
}

const getMIReport = async () => {
  containersInitialised ?? await initialiseContainers()
  const blob = await reportContainer.getBlockBlobClient(config.miReportName)
  return blob.download()
}

const getSuppressedReport = async () => {
  containersInitialised ?? await initialiseContainers()
  const blob = await reportContainer.getBlockBlobClient(config.suppressedReportName)
  return blob.download()
}

module.exports = {
  blobServiceClient,
  getMIReport,
  getSuppressedReport
}
