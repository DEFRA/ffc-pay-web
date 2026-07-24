const GENERATE_REPORT_LIST = require('../../constants/generate-report-list')
const REPORT_TYPES = require('../../constants/report-types')
const GENERATE_REPORT_VIEWS = require('../../constants/generate-report-views')

const {
  generateReportHandler,
  createFormRoute,
  createDownloadRoute,
  addDetailsToFilename
} = require('../../helpers')

const storageConfig = require('../../config').storageConfig
const apArListingSchema = require('../schemas/reports/ap-ar-report-schema')

const getReportFilenameBasedOnType = (payload) => {
  if (payload.reportType === REPORT_TYPES.AP) {
    return storageConfig.apListingReportName
  }

  if (payload.reportType === REPORT_TYPES.AR) {
    return storageConfig.arListingReportName
  }

  return 'default-report.csv'
}

module.exports = [
  createFormRoute(
    GENERATE_REPORT_LIST.AP_AR,
    GENERATE_REPORT_VIEWS.AP_AR
  ),
  createDownloadRoute(
    GENERATE_REPORT_LIST.AP_AR_DOWNLOAD,
    GENERATE_REPORT_VIEWS.AP_AR,
    apArListingSchema,
    generateReportHandler(undefined, (payload) => addDetailsToFilename(getReportFilenameBasedOnType(payload), payload), {
      reportTitle: 'AP/AR listing report',
      reportUrl: GENERATE_REPORT_LIST.AP_AR,
      loadingView: 'report-loading/report-loading',
      reportsUrl: '/download-report-list'
    })
  )
]
