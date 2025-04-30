const config = require('../config')

const getReportTypes = () => {
  if (config.legacyReportsLive) {
    return {
      'Payment request statuses': 'payment-requests',
      'Payment request statuses v2': 'payment-requests-v2',
      'Combined transaction report': 'transaction-summary',
      'Suppressed payment requests': 'suppressed-payments',
      'AP-AR listing report': 'ap-ar-listing',
      Holds: 'holds',
      'Request Editor report': 'request-editor-report',
      'Claim level report': 'claim-level-report'
    }
  }
  return {
    'Payment request statuses': 'payment-requests',
    'Suppressed payment requests': 'suppressed-payments',
    Holds: 'holds'
  }
}

module.exports = {
  getReportTypes
}
