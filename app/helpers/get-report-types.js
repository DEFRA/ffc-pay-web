const getReportTypes = () => {
  return {
    // These don't call call tracking api (Report already exists in BLOB)
    'Payment request statuses': 'payment-requests',
    'Suppressed payment requests': 'suppressed-payments',
    Holds: 'holds',
    'Payment statement status report': 'status-report'
  }
}

module.exports = {
  getReportTypes
}
