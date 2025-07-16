const { getContainerClient } = require('./container-manager')
const config = require('../config').storageConfig

const EMPTY_CONTENT_LENGTH = 5

const getMIReport = async () => {
  const reportContainer = await getContainerClient(config.reportContainer)
  return reportContainer.getBlockBlobClient(config.miReportName).download()
}

const getSuppressedReport = async () => {
  const reportContainer = await getContainerClient(config.reportContainer)
  return reportContainer.getBlockBlobClient(config.suppressedReportName).download()
}

const getDataRequestFile = async (filename) => {
  const dataRequestContainer = await getContainerClient(config.dataRequestContainer)
  const blob = dataRequestContainer.getBlockBlobClient(filename)

  try {
    const properties = await blob.getProperties()
    if (properties.contentLength <= EMPTY_CONTENT_LENGTH) {
      console.warn(`File ${filename} is empty.`)
      throw new Error('No data was found for the selected report criteria. Please review your filters, such as date range or report type, and try again.')
    }
    return await blob.download()
  } finally {
    await blob.delete()
  }
}

module.exports = {
  getMIReport,
  getSuppressedReport,
  getDataRequestFile
}
