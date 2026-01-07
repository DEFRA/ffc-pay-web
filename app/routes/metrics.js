const { applicationAdmin, dataView } = require('../auth/permissions')
const { getAllMetrics } = require('../metrics/get-metrics')
const { generateSchemeYears } = require('../helpers/generate-scheme-years')
const METRICS_ROUTES = require('../constants/metrics-routes')
const METRICS_VIEWS = require('../constants/metrics-views')
const MONTHS = require('../constants/months')

const AUTH_SCOPE = { scope: [applicationAdmin, dataView] }

module.exports = [{
  method: 'GET',
  path: METRICS_ROUTES.BASE,
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      try {
        const selectedPeriod = request.query.period || 'all'
        const schemeYear = request.query.schemeYear ? Number.parseInt(request.query.schemeYear) : null
        const selectedMonth = request.query.month ? Number.parseInt(request.query.month) : null

        let logMessage = `Loading metrics for period: ${selectedPeriod}`
        if (schemeYear) {
          logMessage += `, year: ${schemeYear}`
        }
        if (selectedMonth) {
          logMessage += `, month: ${selectedMonth}`
        }
        console.log(logMessage)

        const { paymentsMetrics, statementsMetrics } = await getAllMetrics(selectedPeriod, schemeYear, selectedMonth)

        let error = null
        if (paymentsMetrics.error || statementsMetrics.error) {
          const errors = []
          if (paymentsMetrics.error) {
            errors.push('payment metrics')
          }
          if (statementsMetrics.error) {
            errors.push('statement metrics')
          }
          error = `Unable to load ${errors.join(' and ')}. Please try again later. If this error persists, contact a member of the Payments and Documents team.`
        }

        return h.view(METRICS_VIEWS.BASE, {
          paymentsMetrics: paymentsMetrics.data,
          statementsMetrics: statementsMetrics.data,
          selectedPeriod,
          schemeYear,
          selectedMonth,
          availableYears: generateSchemeYears(),
          availableMonths: MONTHS,
          error
        })
      } catch (error) {
        console.error('Error loading metrics:', error)

        // Fallback to empty state on error
        return h.view(METRICS_VIEWS.BASE, {
          paymentsMetrics: {
            totalPayments: 0,
            totalValue: 0,
            paymentsByScheme: []
          },
          statementsMetrics: {
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            statementsByScheme: []
          },
          selectedPeriod: 'all',
          schemeYear: null,
          selectedMonth: null,
          availableYears: generateSchemeYears(),
          availableMonths: MONTHS,
          error: 'Unable to load metrics. Please try again later.'
        })
      }
    }
  }
}]
