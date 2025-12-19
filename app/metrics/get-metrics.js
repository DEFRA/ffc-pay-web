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

const getPaymentMetrics = async (period = 'ytd') => {
  console.log(`Fetching payment metrics for period: ${period}`)
  return queries.payments.getPaymentMetrics(period)
}

const getAllMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  console.log(`getAllMetrics called with period: ${period}, schemeYear: ${schemeYear}, month: ${month}`)
  
  const results = await Promise.allSettled([
    getPaymentMetrics(period),
    getStatementMetrics(period, schemeYear, month)
  ])

  const paymentsMetrics = results[0].status === 'fulfilled' 
    ? results[0].value 
    : {
        totalPayments: 0,
        totalValue: 0,
        paymentsByScheme: []
      }

  const statementsMetrics = results[1].status === 'fulfilled'
    ? results[1].value
    : {
        totalStatements: 0,
        totalPrintPost: 0,
        totalPrintPostCost: 0,
        totalEmail: 0,
        totalFailures: 0,
        statementsByScheme: []
      }

  if (results[0].status === 'rejected') {
    console.error('Payment metrics failed:', results[0].reason)
  }
  if (results[1].status === 'rejected') {
    console.error('Statement metrics failed:', results[1].reason)
  }

  return {
    paymentsMetrics,
    statementsMetrics
  }
}

module.exports = {
  getPaymentMetrics,
  getStatementMetrics,
  getAllMetrics
}