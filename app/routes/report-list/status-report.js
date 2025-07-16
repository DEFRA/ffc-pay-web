const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORTS_VIEWS = require('../../constants/report-views')

const {
  generateReportHandler,
  createFormRoute,
  createDownloadRoute,
  addDetailsToFilename
} = require('../../helpers')

const storageConfig = require('../../config').storageConfig
const apArListingSchema = require('../schemas/ap-ar-report-schema')

const getReportFilenameBasedOnType = (payload) => {
  if (payload.reportType === REPORT_TYPES.AP) {
    return storageConfig.apListingReportName
  }

  if (payload.reportType === REPORT_TYPES.AR) {
    return storageConfig.arListingReportName
  }

  return 'default-report.csv'
}

// {
//   method: 'GET',
//   path: REPORT_LIST.STATUS,
//   options: {
//     auth: authOptions,
//     handler: async (_request, h) =>
//       handleStreamResponse(getMIReport, storageConfig.miReportName, h)
//   }
// },

module.exports = [
  createFormRoute(
    REPORT_LIST.AP_AR,
    REPORTS_VIEWS.AP_AR
  ),
  createDownloadRoute(
    REPORT_LIST.AP_AR_DOWNLOAD,
    REPORTS_VIEWS.AP_AR,
    apArListingSchema,
    generateReportHandler(undefined, (payload) => addDetailsToFilename(getReportFilenameBasedOnType(payload), payload))
  )
]
