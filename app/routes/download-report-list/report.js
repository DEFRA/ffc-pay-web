const { getSuppressedReport } = require('../../storage/pay-reports')
const { getHolds } = require('../../holds')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')
const { formatDateFromString } = require('../../helpers/date-time-formatter')
const storageConfig = require('../../config/storage')
const DOWNLOAD_REPORT_LIST = require('../../constants/download-report-list')
const {
  handleCSVResponse,
  handleStreamResponse
} = require('../../helpers')

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: DOWNLOAD_REPORT_LIST.SUPPRESSED_PAYMENTS,
    options: {
      auth: AUTH_SCOPE,
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
    path: DOWNLOAD_REPORT_LIST.HOLDS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        try {
          const paymentHolds = await getHolds(undefined, undefined, false)

          if (!paymentHolds) {
            return h.view('hold-report-unavailable')
          }

          const paymentHoldsData = paymentHolds.map(hold => ({
            frn: hold.frn,
            scheme: hold.holdCategorySchemeName,
            marketingYear: hold.marketingYear ?? 'All',
            agreementNumber: hold.agreementNumber ?? 'All',
            contractNumber: hold.contractNumber ?? 'All',
            holdCategory: hold.holdCategoryName,
            dateAdded: formatDateFromString(hold.dateTimeAdded)
          }))

          return handleCSVResponse(
            paymentHoldsData,
            storageConfig.holdReportName
          )(h)
        } catch (error) {
          console.error('Holds report generation failed.', error)
          return h.view('hold-report-unavailable')
        }
      }
    }
  }
]
