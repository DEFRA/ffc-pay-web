const { getStatementPublisherData } = require('../../api')

/**
 * Get statement metrics for a period
 * Calls ffc-doc-statement-publisher's /metrics endpoint
 */
const getStatementMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  try {
    let url = `/metrics?period=${period}`
    if (period === 'year' && schemeYear) {
      url += `&schemeYear=${schemeYear}`
    }
    if (period === 'monthInYear' && schemeYear && month) {
      url += `&schemeYear=${schemeYear}&month=${month}`
    }
    
    const data = await getStatementPublisherData(url)
    const payload = data.payload
    
    return {
      ...payload,
      totalPrintPostCost: Number.parseInt(payload.totalPrintPostCost) || 0,
      statementsByScheme: payload.statementsByScheme.map(s => ({
        ...s,
        printPostCost: Number.parseInt(s.printPostCost) || 0
      }))
    }
  } catch (error) {
    console.error('Error fetching statement metrics:', error)
    
    // Return empty structure on error
    return {
      totalStatements: 0,
      totalPrintPost: 0,
      totalPrintPostCost: 0,
      totalEmail: 0,
      totalFailures: 0,
      statementsByScheme: []
    }
  }
}

module.exports = {
  getStatementMetrics
}