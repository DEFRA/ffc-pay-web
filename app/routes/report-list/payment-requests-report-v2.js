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
    REPORT_LIST.PAYMENT_REQUESTS_V2,
    REPORTS_VIEWS.PAYMENT_REQUESTS
  ),
  createDownloadRoute(
    REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD,
    REPORTS_VIEWS.PAYMENT_REQUESTS,
    standardReportSchema,
    generateReportHandler(
      REPORT_TYPES.PAYMENT_REQUEST_STATUSES,
      (payload) =>
        addDetailsToFilename(
          storageConfig.paymentRequestsReportName,
          payload
        )
    )
  )
]
