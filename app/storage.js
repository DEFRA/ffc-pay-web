const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised
const BUFFER_SIZE = 4 * 1024 * 1024 // 4 MB
const MAX_CONCURRENCY = 5

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
  const downloadResponse = await blob.download()
  await blob.delete()
  return downloadResponse
}

const saveReportFile = async (filename, readableStream) => {
  try {
    console.debug('[STORAGE] Starting report file save:', filename)
    containersInitialised ?? await initialiseContainers()

    const client = dataRequestContainer.getBlockBlobClient(`${filename}`)
    const options = {
      blobHTTPHeaders: {
        blobContentType: 'text/json'
      }
    }

    return new Promise((resolve, reject) => {
      readableStream.on('error', (err) => {
        reject(err)
      })

      client.uploadStream(
        readableStream,
        BUFFER_SIZE,
        MAX_CONCURRENCY,
        options
      )
        .then(() => {
          console.debug('[STORAGE] Upload completed')
          resolve()
        })
        .catch(reject)
    })
  } catch (error) {
    console.error('[STORAGE] Error saving report file:', error)
    throw error
  }
}

module.exports = {
  blobServiceClient,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  saveReportFile
}
