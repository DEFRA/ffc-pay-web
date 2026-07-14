const GENERATE_REPORT_LIST = require('../../constants/generate-report-list')
const REPORT_TYPES = require('../../constants/report-types')
const GENERATE_REPORT_VIEWS = require('../../constants/generate-report-views')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')

const {
  addDetailsToFilename,
  createDownloadRoute,
  generateReportHandler,
  getView
} = require('../../helpers')

const standardReportSchema = require('../schemas/standard-report-schema')

const storageConfig = require('../../config').storageConfig

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const noResults = request.query.noResults === 'true'
        return getView(GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2, h, { noResults })
      }
    }
  },
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
        reportTitle: 'Generate payment request statuses report',
        reportUrl: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2,
        loadingView: 'report-loading/report-loading',
        reportsUrl: '/generate-report-list'
      }
    )
  )
]
