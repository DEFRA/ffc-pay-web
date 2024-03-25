const { getMIReport, getSuppressedReport, getTransactionSummary } = require('../storage')
const { getHolds } = require('../holds')
const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const formatDate = require('../format-date')
const convertToCsv = require('../convert-to-csv')
const storageConfig = require('../config/storage')
const config = require('../config')

module.exports = [{
  method: 'GET',
  path: '/report/payment-requests',
  options: {
    auth: { scope: [schemeAdmin, holdAdmin, dataView] },
    handler: async (_request, h) => {
      try {
        const response = await getMIReport()
        if (response) {
          return h.response(response.readableStreamBody)
            .type('text/csv')
            .header('Connection', 'keep-alive')
            .header('Cache-Control', 'no-cache')
            .header('Content-Disposition', `attachment;filename=${storageConfig.miReportName}`)
        }
      } catch {
        return h.view('payment-report-unavailable')
      }
    }
  }
}, {
  method: 'GET',
  path: '/report/transaction-summary',
  options: {
    auth: { scope: [schemeAdmin, holdAdmin, dataView] },
    handler: async (_request, h) => {
      try {
        const response = await getTransactionSummary()
        if (response) {
          return h.response(response.readableStreamBody)
            .type('text/csv')
            .header('Connection', 'keep-alive')
            .header('Cache-Control', 'no-cache')
            .header('Content-Disposition', `attachment;filename=${storageConfig.summaryReportName}`)
        }
      } catch {
        return h.view('payment-report-unavailable')
      }
    }
  }
},
{
  method: 'GET',
  path: '/report/suppressed-payments',
  options: {
    auth: { scope: [schemeAdmin, holdAdmin, dataView] },
    handler: async (_request, h) => {
      try {
        const response = await getSuppressedReport()
        if (response) {
          return h.response(response.readableStreamBody)
            .type('text/csv')
            .header('Connection', 'keep-alive')
            .header('Cache-Control', 'no-cache')
            .header('Content-Disposition', `attachment;filename=${storageConfig.suppressedReportName}`)
        }
      } catch {
        return h.view('payment-report-unavailable')
      }
    }
  }
},
{
  method: 'GET',
  path: '/report/holds',
  options: {
    auth: { scope: [schemeAdmin, holdAdmin, dataView] },
    handler: async (_request, h) => {
      try {
        const paymentHolds = await getHolds()
        if (paymentHolds) {
          const paymentHoldsData = paymentHolds.map(hold => {
            return {
              frn: hold.frn,
              scheme: hold.holdCategorySchemeName,
              marketingYear: hold.marketingYear,
              holdCategory: hold.holdCategoryName,
              dateAdded: formatDate(hold.dateTimeAdded)
            }
          })
          const response = convertToCsv(paymentHoldsData)
          if (response) {
            return h.response(response)
              .type('text/csv')
              .header('Connection', 'keep-alive')
              .header('Cache-Control', 'no-cache')
              .header('Content-Disposition', `attachment;filename=${config.holdReportName}`)
          }
        }

        return h.view('hold-report-unavailable')
      } catch {
        return h.view('hold-report-unavailable')
      }
    }
  }
}]
