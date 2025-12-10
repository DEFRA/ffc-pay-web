const { applicationAdmin, dataView } = require('../auth/permissions')
// const { getProcessingData } = require('../api')

const METRICS_ROUTES = require('../constants/metrics-routes')
const METRICS_VIEWS = require('../constants/metrics-views')
const AUTH_SCOPE = { scope: [applicationAdmin, dataView] }

module.exports = [{
  method: 'GET',
  path: METRICS_ROUTES.BASE,
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      // TODO: Replace with actual API calls when backend is ready
      const paymentsMetrics = {
        totalPayments: 12543,
        totalValue: 45678900,
        paymentsByScheme: [
          { schemeName: 'SFI23', totalPayments: 4521, totalValue: 15234567, paymentsByStatus: { pending: 120, processed: 4401 } },
          { schemeName: 'BPS', totalPayments: 3421, totalValue: 12345678, paymentsByStatus: { pending: 89, processed: 3332 } },
          { schemeName: 'CS', totalPayments: 2301, totalValue: 9876543, paymentsByStatus: { pending: 45, processed: 2256 } },
          { schemeName: 'Delinked', totalPayments: 2300, totalValue: 8222112, paymentsByStatus: { pending: 67, processed: 2233 } }
        ]
      }

      const statementsMetrics = {
        totalStatements: 8932,
        statementsByScheme: [
          { schemeName: 'SFI23', totalStatements: 3201, printPostCount: 2140, printPostCost: 4280, emailCount: 1061 },
          { schemeName: 'BPS', totalStatements: 2531, printPostCount: 1687, printPostCost: 3374, emailCount: 844 },
          { schemeName: 'CS', totalStatements: 1900, printPostCount: 1267, printPostCost: 2534, emailCount: 633 },
          { schemeName: 'Delinked', totalStatements: 1300, printPostCount: 867, printPostCost: 1734, emailCount: 433 }
        ],
        totalPrintPost: 5961,
        totalPrintPostCost: 11922,
        totalEmail: 2971
      }

      return h.view(METRICS_VIEWS.BASE, {
        paymentsMetrics,
        statementsMetrics,
        selectedPeriod: 'ytd' // year-to-date as default
      })
    }
  }
}]
