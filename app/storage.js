const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

const EMPTY_CONTENT_LENGTH = 5 // Maximum content length to consider a file as empty

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
const dataRequestContainer = blobServiceClient.getContainerClient(config.dataRequestContainer)

const initialiseContainers = async () => {
  if (config.createContainers) {
    console.log('Making sure blob containers exist')
    await projectionContainer.createIfNotExists()
    await reportContainer.createIfNotExists()
    await dataRequestContainer.createIfNotExists()
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

const getDataRequestFile = async (filename) => {
  containersInitialised ?? await initialiseContainers()
  const blob = await dataRequestContainer.getBlockBlobClient(filename)

  try {
    const properties = await blob.getProperties()

    if (properties.contentLength <= EMPTY_CONTENT_LENGTH) {
      console.warn(`File ${filename} is empty.`)
      throw new Error('No data was found for the selected report criteria. Please review your filters, such as date range or report type, and try again.')
    }

    const downloadResponse = await blob.download()
    return downloadResponse
  } finally {
    await blob.delete()
  }
}

module.exports = {
  blobServiceClient,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile
}
