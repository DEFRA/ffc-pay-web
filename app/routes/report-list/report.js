const { getMIReport, getSuppressedReport } = require('../../storage')
const { getHolds } = require('../../holds')
const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const formatDate = require('../../helpers/format-date')
const storageConfig = require('../../config/storage')
const {
  handleCSVResponse,
  handleStreamResponse
} = require('../../helpers')

const REPORT_LIST = {
  PAYMENT_REQUESTS: '/report-list/payment-requests',
  SUPPRESSED_PAYMENTS: '/report-list/suppressed-payments',
  HOLDS: '/report-list/holds',
  REPORT_UNAVAILABLE: '/report-unavailable'
}
const REPORTS_VIEWS = {
  PAYMENT_REQUESTS: 'reports-list/payment-requests',
  HOLD_REPORT_UNAVAILABLE: 'hold-report-unavailable',
  REPORT_UNAVAILABLE: 'report-unavailable'
}

const authOptions = { scope: [schemeAdmin, holdAdmin, dataView] }

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
