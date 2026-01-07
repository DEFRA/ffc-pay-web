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

const getAllMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  console.log(`getAllMetrics called with period: ${period}, schemeYear: ${schemeYear}, month: ${month}`)

  const results = await Promise.allSettled([
    getPaymentMetrics(period, schemeYear, month),
    getStatementMetrics(period, schemeYear, month)
  ])

  const paymentsResult = results[0].status === 'fulfilled'
    ? results[0].value
    : {
        data: {
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
        },
        error: true,
        message: 'Unable to load payment metrics. Please try again later.'
      }

  const statementsResult = results[1].status === 'fulfilled'
    ? results[1].value
    : {
        data: {
          totalStatements: 0,
          totalPrintPost: 0,
          totalPrintPostCost: 0,
          totalEmail: 0,
          totalFailures: 0,
          statementsByScheme: []
        },
        error: true,
        message: 'Unable to load statement metrics. Please try again later.'
      }

  if (results[0].status === 'rejected') {
    console.error('Payment metrics failed:', results[0].reason)
  }
  if (results[1].status === 'rejected') {
    console.error('Statement metrics failed:', results[1].reason)
  }

  return {
    paymentsMetrics: paymentsResult,
    statementsMetrics: statementsResult
  }
}

module.exports = {
  getPaymentMetrics,
  getStatementMetrics,
  getAllMetrics
}
