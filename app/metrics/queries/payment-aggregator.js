/**
 * Get payment metrics for a period
 * TODO: Implement when ffc-pay-processing has metrics endpoint
 */
const getPaymentMetrics = async (period = 'ytd') => {
  console.log(`Payment metrics not yet implemented for period: ${period}`)
  
  // Return mock data for now
  return {
    totalPayments: 12543,
    totalValue: 45678900,
    paymentsByScheme: [
      { schemeName: 'SFI23', totalPayments: 4521, totalValue: 15234567, paymentsByStatus: { pending: 120, processed: 4401 } },
      { schemeName: 'BPS', totalPayments: 3421, totalValue: 12345678, paymentsByStatus: { pending: 89, processed: 3332 } },
      { schemeName: 'CS', totalPayments: 2301, totalValue: 9876543, paymentsByStatus: { pending: 45, processed: 2256 } },
      { schemeName: 'Delinked', totalPayments: 2300, totalValue: 8222112, paymentsByStatus: { pending: 67, processed: 2233 } }
    ]
  }
}

module.exports = {
  getPaymentMetrics
}