const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config/blob-storage')
let blobServiceClient
let containersInitialised

if (config.useConnectionStr) {
  console.log('Using connection string for BlobServiceClient')
  blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
} else {
  console.log('Using DefaultAzureCredential for BlobServiceClient')
  const uri = `https://${config.storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
}

const batchContainer = blobServiceClient.getContainerClient(config.batchContainer)
const daxContainer = blobServiceClient.getContainerClient(config.daxContainer)

async function initialiseContainers () {
  if (config.createContainers) {
    console.log('Making sure blob containers exist')
    await batchContainer.createIfNotExists()
    await daxContainer.createIfNotExists()
  }
  await initialiseFolders()
  containersInitialised = true
}

async function initialiseFolders () {
  await initialiseFolder(batchContainer, config.inboundFolder)
  await initialiseFolder(batchContainer, config.archiveFolder)
  await initialiseFolder(batchContainer, config.quarantineFolder)
  await initialiseFolder(daxContainer, config.inboundFolder)
  await initialiseFolder(daxContainer, config.archiveFolder)
  await initialiseFolder(daxContainer, config.quarantineFolder)
  await initialiseFolder(daxContainer, config.outboundFolder)
}

async function initialiseFolder (container, prefix) {
  const placeHolderText = 'Placeholder'
  const client = container.getBlockBlobClient(`${prefix}/default.txt`)
  await client.upload(placeHolderText, placeHolderText.length)
}

async function getBlob (container, folder, filename) {
  containersInitialised ?? await initialiseContainers()
  return container.getBlockBlobClient(`${folder}/${filename}`)
}

async function getFileList (container, prefix) {
  containersInitialised ?? await initialiseContainers()
  const fileList = []
  for await (const file of container.listBlobsFlat({ prefix })) {
    if (file.name.endsWith('.dat') || file.name.endsWith('.csv')) {
      fileList.push(file.name.replace(`${prefix}/`, ''))
    }
  }
  return { containerName: container._containerName, prefix, fileList }
}

async function getFileDetails (containerName, prefix, filename) {
  const container = getContainer(containerName)
  const blob = await getBlob(container, prefix, filename)
  return blob.getProperties()
}

async function getStorageDetails () {
  const batchInbound = await getFileList(batchContainer, config.inboundFolder)
  const batchArchive = await getFileList(batchContainer, config.archiveFolder)
  const batchQuarantine = await getFileList(batchContainer, config.quarantineFolder)
  const daxInbound = await getFileList(daxContainer, config.inboundFolder)
  const daxArchive = await getFileList(daxContainer, config.archiveFolder)
  const daxQuarantine = await getFileList(daxContainer, config.quarantineFolder)
  const daxOutbound = await getFileList(daxContainer, config.outboundFolder)

  return { batchInbound, batchArchive, batchQuarantine, daxInbound, daxArchive, daxQuarantine, daxOutbound }
}

const getContainer = (containerName) => {
  if (containerName === config.batchContainer) {
    return batchContainer
  }
  if (containerName === config.daxContainer) {
    return daxContainer
  }

  return null
}

async function downloadPaymentFile (constainerName, prefix, filename) {
  const container = getContainer(constainerName)
  const blob = await getBlob(container, prefix, filename)
  const blobBuffer = await blob.downloadToBuffer()
  return blobBuffer.toString('utf-8')
}

module.exports = {
  downloadPaymentFile,
  getFileDetails,
  getFileList,
  getStorageDetails,
  blobServiceClient
}
