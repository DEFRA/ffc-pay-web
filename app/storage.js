const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

const EMPTY_CONTENT_LENGTH = 5 // Maximum content length to consider a file as empty

if (config.useConnectionStr) {
  console.log('Using connection string for BlobServiceClient')
  blobServiceClient = BlobServiceClient.fromConnectionString(config.payConnectionStr)
} else {
  console.log('Using DefaultAzureCredential for BlobServiceClient')
  const uri = `https://${config.payStorageAccount}.blob.core.windows.net`
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

const REPORT_TYPE_PREFIXES = [
  'sustainable-farming-incentive-',
  'delinked-payment-statement-'
]

const getValidReportYears = async () => {
  containersInitialised ?? await initialiseContainers()

  const yearTypeSet = new Set()

  for await (const blob of reportContainer.listBlobsFlat()) {
    const prefix = REPORT_TYPE_PREFIXES.find(p => blob.name.startsWith(p))
    if (!prefix) continue

    const datePart = blob.name
      .replace(prefix, '')
      .replace('.csv', '')
      .replace(/_/g, ':')

    const reportDate = new Date(datePart)
    if (isNaN(reportDate.getTime())) continue

    const year = reportDate.getFullYear()
    const type = prefix.replace(/-$/, '')

    yearTypeSet.add(JSON.stringify({ year, type }))
  }

  return Array.from(yearTypeSet)
    .map(entry => JSON.parse(entry))
    .sort((a, b) => b.year - a.year)
}

const getReportsByYearAndType = async (year, type) => {
  containersInitialised ?? await initialiseContainers()

  const prefix = REPORT_TYPE_PREFIXES.find(p => p.startsWith(type))
  if (!prefix) return []

  const reports = []
  for await (const blob of reportContainer.listBlobsFlat()) {
    if (!blob.name.startsWith(prefix)) continue

    const datePart = blob.name.replace(prefix, '').replace('.csv', '')
    const reportDate = new Date(datePart)

    if (isNaN(reportDate.getTime())) continue
    if (reportDate.getFullYear() !== Number(year)) continue

    reports.push({
      name: blob.name,
      date: reportDate,
      type
    })
  }

  return reports
}

const getStatusReport = async (reportName) => {
  containersInitialised ?? await initialiseContainers()
  const blob = await reportContainer.getBlockBlobClient(reportName)
  return blob.download()
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
  getValidReportYears,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getReportsByYearAndType,
  getStatusReport
}
