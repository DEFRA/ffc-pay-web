const { getProcessingData } = require('../../api')

const transformPaymentScheme = (scheme) => ({
  schemeName: scheme.schemeName,
  schemeYear: scheme.schemeYear,
  totalPayments: scheme.totalPayments || 0,
  totalValue: Number.parseInt(scheme.totalValue) || 0,
  paymentsByStatus: {
    pending: scheme.pendingPayments || 0,
    processed: scheme.processedPayments || 0
  }
})

const buildTotalMetrics = (payload) => ({
  totalPayments: payload.totalPayments || 0,
  totalValue: Number.parseInt(payload.totalValue) || 0,
  totalPendingPayments: payload.totalPendingPayments || 0,
  totalPendingValue: Number.parseInt(payload.totalPendingValue) || 0
})

const buildProcessedMetrics = (payload) => ({
  totalProcessedPayments: payload.totalProcessedPayments || 0,
  totalProcessedValue: Number.parseInt(payload.totalProcessedValue) || 0,
  totalSettledPayments: payload.totalSettledPayments || 0,
  totalSettledValue: Number.parseInt(payload.totalSettledValue) || 0
})

const buildHoldMetrics = (payload) => ({
  totalPaymentsOnHold: payload.totalPaymentsOnHold || 0,
  totalValueOnHold: Number.parseInt(payload.totalValueOnHold) || 0
})

const buildPaymentMetricsData = (payload) => ({
  ...buildTotalMetrics(payload),
  ...buildProcessedMetrics(payload),
  ...buildHoldMetrics(payload),
  paymentsByScheme: (payload.paymentsByScheme || []).map(transformPaymentScheme)
})

const buildEmptyPaymentMetrics = () => ({
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
})

/**
 * Get payment metrics for a period
 * Calls ffc-pay-processing's /metrics endpoint
 */
const getPaymentMetrics = async (period = 'ytd', schemeYear = null, month = null) => {
  try {
    let url = `/metrics?period=${period}`
    if (period === 'year' && schemeYear) {
      url += `&schemeYear=${schemeYear}`
    }
    if (period === 'monthInYear' && schemeYear && month) {
      url += `&schemeYear=${schemeYear}&month=${month}`
    }

    const data = await getProcessingData(url)
    const payload = data.payload

    return {
      data: buildPaymentMetricsData(payload),
      error: false,
      message: ''
    }
  } catch (error) {
    console.error('Error fetching payment metrics:', error.message)

    return {
      data: buildEmptyPaymentMetrics(),
      error: true,
      message: 'Unable to load payment metrics. Please try again later.'
    }
  }
}

module.exports = {
  getPaymentMetrics
}
