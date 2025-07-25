const REPORT_LIST = require('../../constants/report-list')
const REPORT_TYPES = require('../../constants/report-types')
const REPORT_VIEWS = require('../../constants/report-views')

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
    REPORT_VIEWS.PAYMENT_REQUESTS_V2
  ),
  createDownloadRoute(
    REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD,
    REPORT_VIEWS.PAYMENT_REQUESTS_V2,
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
