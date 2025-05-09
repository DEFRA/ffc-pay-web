const { getMIReport, getSuppressedReport } = require('../storage')
const { getHolds } = require('../holds')
const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const formatDate = require('../helpers/format-date')
const storageConfig = require('../config/storage')
const {
  addDetailsToFilename,
  createReportHandler,
  handleCSVResponse,
  renderErrorPage,
  getView,
  handleStreamResponse
} = require('../helpers')
const transactionSummaryFields = require('../constants/transaction-summary-fields')

const standardReportSchema = require('./schemas/standard-report-schema')
const REPORT_LIST = {
  PAYMENT_REQUESTS: '/report-list/payment-requests',
  PAYMENT_REQUESTS_V2: '/report-list/payment-requests-v2',
  PAYMENT_REQUESTS_V2_DOWNLOAD: '/report-list/payment-requests-v2/download',
  TRANSACTION_SUMMARY: '/report-list/transaction-summary',
  TRANSACTION_SUMMARY_DOWNLOAD: '/report-list/transaction-summary/download',
  CLAIM_LEVEL_REPORT: '/report-list/claim-level-report',
  CLAIM_LEVEL_REPORT_DOWNLOAD: '/report-list/claim-level-report/download',
  REQUEST_EDITOR_REPORT: '/report-list/request-editor-report',
  SUPPRESSED_PAYMENTS: '/report-list/suppressed-payments',
  HOLDS: '/report-list/holds',
  REPORT_UNAVAILABLE: '/report-unavailable'
}
const REPORTS_VIEWS = {
  PAYMENT_REQUESTS: 'reports-list/payment-requests-v2',
  TRANSACTION_SUMMARY: 'reports-list/transaction-summary',
  CLAIM_LEVEL_REPORT: 'reports-list/claim-level-report',
  REQUEST_EDITOR_REPORT: 'reports-list/request-editor-report',
  HOLD_REPORT_UNAVAILABLE: 'hold-report-unavailable',
  REPORT_UNAVAILABLE: 'report-unavailable'
}
const REPORTS_HANDLER = {
  PAYMENT_REQUESTS: '/payment-requests-report',
  TRANSACTION_SUMMARY: '/transaction-summary',
  CLAIM_LEVEL_REPORT: '/claim-level-report',
  REQUEST_EDITOR_REPORT: '/request-editor-report'
}

const authOptions = { scope: [schemeAdmin, holdAdmin, dataView] }

const getTransactionSummaryHandler = createReportHandler(
  REPORTS_HANDLER.TRANSACTION_SUMMARY,
  transactionSummaryFields,
  (schemeId, year, revenueOrCapital, prn, frn) =>
    addDetailsToFilename(
      storageConfig.summaryReportName,
      schemeId,
      year,
      prn,
      revenueOrCapital,
      frn
    ),
  REPORTS_VIEWS.TRANSACTION_SUMMARY
)

module.exports = [
  {
    method: 'GET',
    path: REPORT_LIST.PAYMENT_REQUESTS,
    options: {
      auth: authOptions,
      handler: async (_request, h) =>
        handleStreamResponse(getMIReport, storageConfig.miReportName, h)
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.TRANSACTION_SUMMARY,
    options: {
      auth: authOptions,
      handler: async (_request, h) => {
        return getView(REPORTS_VIEWS.TRANSACTION_SUMMARY, h)
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.TRANSACTION_SUMMARY_DOWNLOAD,
    options: {
      auth: authOptions,
      validate: {
        query: standardReportSchema,
        failAction: async (request, h, err) => {
          return renderErrorPage(
            REPORTS_VIEWS.TRANSACTION_SUMMARY,
            request,
            h,
            err
          )
        }
      },
      handler: getTransactionSummaryHandler
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.SUPPRESSED_PAYMENTS,
    options: {
      auth: authOptions,
      handler: async (_request, h) =>
        handleStreamResponse(
          getSuppressedReport,
          storageConfig.suppressedReportName,
          h
        )
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.HOLDS,
    options: {
      auth: authOptions,
      handler: async (_request, h) => {
        try {
          const paymentHolds = await getHolds(undefined, undefined, false)

          if (!paymentHolds) {
            return h.view(REPORTS_VIEWS.HOLD_REPORT_UNAVAILABLE)
          }

          const paymentHoldsData = paymentHolds.map(hold => ({
            frn: hold.frn,
            scheme: hold.holdCategorySchemeName,
            marketingYear: hold.marketingYear ?? 'All',
            holdCategory: hold.holdCategoryName,
            dateAdded: formatDate(hold.dateTimeAdded)
          }))

          return handleCSVResponse(
            paymentHoldsData,
            storageConfig.holdReportName
          )(h)
        } catch {
          return h.view(REPORTS_VIEWS.HOLD_REPORT_UNAVAILABLE)
        }
      }
    }
  },
  {
    method: 'GET',
    path: REPORT_LIST.REPORT_UNAVAILABLE,
    options: {
      auth: authOptions,
      handler: async (_request, h) => {
        return h.view(REPORTS_VIEWS.REPORT_UNAVAILABLE)
      }
    }
  }
]
