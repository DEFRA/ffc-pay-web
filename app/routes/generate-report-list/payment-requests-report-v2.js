const GENERATE_REPORT_LIST = require('../../constants/generate-report-list')
const REPORT_TYPES = require('../../constants/report-types')
const GENERATE_REPORT_VIEWS = require('../../constants/generate-report-views')

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
    GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2,
    GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2
  ),
  createDownloadRoute(
    GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD,
    GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2,
    standardReportSchema,
    generateReportHandler(
      REPORT_TYPES.PAYMENT_REQUEST_STATUSES,
      (payload) =>
        addDetailsToFilename(
          storageConfig.paymentRequestsReportName,
          payload
        ),
      {
        reportTitle: 'Payment request statuses report',
        reportUrl: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2,
        loadingView: 'report-loading/report-loading',
        reportsUrl: '/generate-report-list'
      }
    )
  )
]
