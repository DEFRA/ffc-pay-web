const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORTS_VIEWS = require('../../constants/report-views')

const {
  addDetailsToFilename,
  createFormRoute,
  createDownloadRoute,
  generateReportHandler
} = require('../../helpers')

const standardReportSchema = require('../schemas/standard-report-schema')

const storageConfig = require('../../config').storageConfig

module.exports = [
  createFormRoute(
    REPORT_LIST.TRANSACTION_SUMMARY,
    REPORTS_VIEWS.TRANSACTION_SUMMARY
  ),
  createDownloadRoute(
    REPORT_LIST.TRANSACTION_SUMMARY_DOWNLOAD,
    REPORTS_VIEWS.TRANSACTION_SUMMARY,
    standardReportSchema,
    generateReportHandler(
      REPORT_TYPES.COMBINED_TRANSACTION,
      (payload) =>
        addDetailsToFilename(
          storageConfig.summaryReportName,
          payload
        )
    )
  )
]
