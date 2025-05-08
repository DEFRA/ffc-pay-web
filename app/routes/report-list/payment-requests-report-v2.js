const REPORT_LIST = require('../../constants/report-list')
const REPORTS_VIEWS = require('../../constants/report-views')
const REPORTS_HANDLER = require('../../constants/report-handlers')
const REQUEST_FIELDS = require('../constants/payment-requests-report-fields')

const {
  addDetailsToFilename,
  createReportHandler,
  createFormRoute,
  createDownloadRoute
} = require('../../helpers')

const standardReportSchema = require('./schemas/standard-report-schema')

const storageConfig = require('../config/storage')

const getPaymentRequestsHandler = createReportHandler(
  REPORTS_HANDLER.PAYMENT_REQUESTS,
  REQUEST_FIELDS,
  (schemeId, year, revenueOrCapital, prn, frn) =>
    addDetailsToFilename(
      storageConfig.paymentRequestsReportName,
      schemeId,
      year,
      prn,
      revenueOrCapital,
      frn
    ),
  REPORTS_VIEWS.PAYMENT_REQUESTS
)

module.exports = [
  createFormRoute(
    REPORT_LIST.PAYMENT_REQUESTS_V2,
    REPORTS_VIEWS.PAYMENT_REQUESTS
  ),
  createDownloadRoute(
    REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD,
    REPORTS_VIEWS.PAYMENT_REQUESTS,
    standardReportSchema,
    getPaymentRequestsHandler
  )
]
