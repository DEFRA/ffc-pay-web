const { applicationAdmin, dataView } = require('../auth/permissions')
const { getAllMetrics } = require('../metrics/get-metrics')
const { generateSchemeYears } = require('../helpers/generate-scheme-years')
const METRICS_ROUTES = require('../constants/metrics-routes')
const METRICS_VIEWS = require('../constants/metrics-views')
const MONTHS = require('../constants/months')

const AUTH_SCOPE = { scope: [applicationAdmin, dataView] }

const buildCriticalErrorMessage = () => {
  return 'Unable to load metrics from both payment and statement services. Please try again later or contact the Payments and Documents team.'
}

const buildPartialFailureMessage = (paymentsMetrics, statementsMetrics) => {
  const errors = []
  if (paymentsMetrics.error) {
    errors.push('payment metrics')
  }
  if (statementsMetrics.error) {
    errors.push('statement metrics')
  }
  const connectionIssue = paymentsMetrics.errorType === 'connection' || statementsMetrics.errorType === 'connection'
  return `Unable to load ${errors.join(' and ')}. ${connectionIssue ? 'Connection issue detected. ' : ''}Please try again later. If this error persists, contact a member of the Payments and Documents team.`
}

const buildNoDataMessage = (noData, noPaymentData, noStatementData) => {
  if (noData) {
    return 'No metrics data is available for the selected period from either payment or statement services. This may indicate no activity has been recorded yet.'
  }

  if (noPaymentData && noStatementData) {
    return 'No payment or statement metrics data is available for the selected period.'
  }

  if (noPaymentData) {
    return 'No payment metrics data is available for the selected period.'
  }

  if (noStatementData) {
    return 'No statement metrics data is available for the selected period.'
  }

  return null
}

const buildErrorMessage = (paymentsMetrics, statementsMetrics, criticalError, partialFailure, noData, noPaymentData, noStatementData) => {
  if (criticalError) {
    return buildCriticalErrorMessage()
  }

  if (partialFailure) {
    return buildPartialFailureMessage(paymentsMetrics, statementsMetrics)
  }

  return buildNoDataMessage(noData, noPaymentData, noStatementData)
}

const buildViewData = (paymentsMetrics, statementsMetrics, selectedPeriod, schemeYear, selectedMonth, error) => {
  return {
    paymentsMetrics: paymentsMetrics.data,
    statementsMetrics: statementsMetrics.data,
    selectedPeriod,
    schemeYear,
    selectedMonth,
    availableYears: generateSchemeYears(),
    availableMonths: MONTHS,
    error
  }
}

const buildFallbackViewData = () => {
  return {
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
  }
}

const buildLogMessage = (selectedPeriod, schemeYear, selectedMonth) => {
  let logMessage = `Loading metrics for period: ${selectedPeriod}`
  if (schemeYear) {
    logMessage += `, year: ${schemeYear}`
  }
  if (selectedMonth) {
    logMessage += `, month: ${selectedMonth}`
  }
  return logMessage
}

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

        console.log(buildLogMessage(selectedPeriod, schemeYear, selectedMonth))

        const { paymentsMetrics, statementsMetrics, criticalError, partialFailure, noData, noPaymentData, noStatementData } = await getAllMetrics(selectedPeriod, schemeYear, selectedMonth)

        const error = buildErrorMessage(paymentsMetrics, statementsMetrics, criticalError, partialFailure, noData, noPaymentData, noStatementData)

        return h.view(METRICS_VIEWS.BASE, buildViewData(paymentsMetrics, statementsMetrics, selectedPeriod, schemeYear, selectedMonth, error))
      } catch (error) {
        console.error('Error loading metrics:', error)
        return h.view(METRICS_VIEWS.BASE, buildFallbackViewData())
      }
    }
  }
}]
