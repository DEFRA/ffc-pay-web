const queries = require('./queries')

const getStatementMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  let logMessage = `Fetching statement metrics for period: ${period}`
  if (schemeYear) {
    logMessage += `, year: ${schemeYear}`
  }
  if (month) {
    logMessage += `, month: ${month}`
  }
  console.log(logMessage)
  return queries.statements.getStatementMetrics(period, schemeYear, month)
}

const getPaymentMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  let logMessage = `Fetching payment metrics for period: ${period}`
  if (schemeYear) {
    logMessage += `, year: ${schemeYear}`
  }
  if (month) {
    logMessage += `, month: ${month}`
  }
  console.log(logMessage)
  return queries.payments.getPaymentMetrics(period, schemeYear, month)
}

const buildErrorResult = (serviceName, reason) => {
  const isPayment = serviceName === 'payment'
  const emptyData = isPayment
    ? {
        totalPayments: 0,
        totalValue: 0,
        totalPendingPayments: 0,
        totalPendingValue: 0,
        totalProcessedPayments: 0,
        totalProcessedValue: 0,
        totalSettledPayments: 0,
        totalSettledValue: 0,
        totalPaymentsOnHold: 0,
        totalValueOnHold: 0,
        paymentsByScheme: []
      }
    : {
        totalStatements: 0,
        totalPrintPost: 0,
        totalPrintPostCost: 0,
        totalEmail: 0,
        totalFailures: 0,
        statementsByScheme: []
      }

  const errorType = reason?.message?.includes('ECONNREFUSED') || reason?.message?.includes('timeout')
    ? 'connection'
    : 'service'

  return {
    data: emptyData,
    error: true,
    errorType,
    message: `Unable to load ${serviceName} metrics. Please try again later.`,
    reason: reason?.message || 'Unknown error'
  }
}

const hasNoPaymentData = (data) => {
  return data.totalPayments === 0 &&
    data.totalValue === 0 &&
    data.paymentsByScheme.length === 0
}

const hasNoStatementData = (data) => {
  return data.totalStatements === 0 &&
    data.totalPrintPost === 0 &&
    data.totalEmail === 0 &&
    data.statementsByScheme.length === 0
}

const logErrors = (results, paymentsResult, statementsResult) => {
  if (results[0].status === 'rejected') {
    console.error('Payment metrics failed:', results[0].reason)
  }
  if (results[1].status === 'rejected') {
    console.error('Statement metrics failed:', results[1].reason)
  }

  if (paymentsResult.error && results[0].status === 'fulfilled') {
    console.error('Payment metrics returned error:', paymentsResult.message)
  }
  if (statementsResult.error && results[1].status === 'fulfilled') {
    console.error('Statement metrics returned error:', statementsResult.message)
  }
}

const logCriticalErrors = (bothServicesDown, paymentsResult, statementsResult) => {
  if (!bothServicesDown) {
    return
  }

  const connectionIssue = paymentsResult.errorType === 'connection' || statementsResult.errorType === 'connection'
  if (connectionIssue) {
    console.error('Critical: Both metrics services are unreachable. Possible network or infrastructure issue.')
  } else {
    console.error('Critical: Both metrics services returned errors.')
  }
}

const logDataAvailability = (bothDataEmpty, paymentDataEmpty, statementDataEmpty) => {
  if (bothDataEmpty) {
    console.log('Info: No metrics data available from either service for the selected period.')
    return
  }

  if (paymentDataEmpty) {
    console.log('Info: No payment metrics data available for the selected period.')
    return
  }

  if (statementDataEmpty) {
    console.log('Info: No statement metrics data available for the selected period.')
  }
}

const getAllMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  console.log(`getAllMetrics called with period: ${period}, schemeYear: ${schemeYear}, month: ${month}`)

  const results = await Promise.allSettled([
    getPaymentMetrics(period, schemeYear, month),
    getStatementMetrics(period, schemeYear, month)
  ])

  const paymentsResult = results[0].status === 'fulfilled'
    ? results[0].value
    : buildErrorResult('payment', results[0].reason)

  const statementsResult = results[1].status === 'fulfilled'
    ? results[1].value
    : buildErrorResult('statement', results[1].reason)

  logErrors(results, paymentsResult, statementsResult)

  const hasPaymentError = paymentsResult.error
  const hasStatementError = statementsResult.error
  const bothServicesDown = hasPaymentError && hasStatementError

  const paymentDataEmpty = !hasPaymentError && hasNoPaymentData(paymentsResult.data)
  const statementDataEmpty = !hasStatementError && hasNoStatementData(statementsResult.data)
  const bothDataEmpty = paymentDataEmpty && statementDataEmpty

  logCriticalErrors(bothServicesDown, paymentsResult, statementsResult)
  logDataAvailability(bothDataEmpty, paymentDataEmpty, statementDataEmpty)

  return {
    paymentsMetrics: paymentsResult,
    statementsMetrics: statementsResult,
    criticalError: bothServicesDown,
    partialFailure: hasPaymentError || hasStatementError,
    noData: bothDataEmpty,
    noPaymentData: paymentDataEmpty,
    noStatementData: statementDataEmpty
  }
}

module.exports = {
  getPaymentMetrics,
  getStatementMetrics,
  getAllMetrics
}
