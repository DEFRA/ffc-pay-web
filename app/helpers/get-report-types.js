const getReportTypes = () => {
  return {
    'Payment request statuses': 'payment-requests-v2',
    'Suppressed payment requests': 'suppressed-payments',
    'AP-AR listing report': 'ap-ar-report',
    Holds: 'holds',
    'Request Editor report': 'request-editor-report',
    'Payment statement status report': 'status-report'
  }
}

module.exports = {
  getReportTypes
}
