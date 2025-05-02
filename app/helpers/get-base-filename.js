const REPORT_TYPES = require('../constants/report-types')
const storageConfig = require('../storageConfig/storage')

const startsAt = 0
const removeFromEnd = -4

const getBaseFilename = reportName => {
  const fileNames = {
    [REPORT_TYPES.AR_LISTING]: storageConfig.arListingReportName,
    [REPORT_TYPES.REQUEST_EDITOR]: storageConfig.requestEditorReportName,
    [REPORT_TYPES.CLAIM_LEVEL]: storageConfig.claimLevelReportName,
    default: storageConfig.apListingReportName
  }
  return (fileNames[reportName] || fileNames.default).slice(
    startsAt,
    removeFromEnd
  )
}

module.exports = { getBaseFilename }
