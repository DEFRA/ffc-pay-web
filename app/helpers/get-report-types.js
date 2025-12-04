const config = require('../config')

const getReportTypes = () => {
  console.log(`Legacy reports are ${process.env.LEGACY_REPORTS_ACTIVE ? '' : 'not '}active in this environment.`)
  if (config.legacyReportsActive) {
    return {
      'Payment request statuses - old version to be decommissioned': 'payment-requests',
      'Payment request statuses': 'payment-requests-v2',
      'Suppressed payment requests': 'suppressed-payments',
      'AP-AR listing report': 'ap-ar-report',
      Holds: 'holds',
      'Request Editor report - received and released from RE dates to be added 08/12/2025': 'request-editor-report',
      'Payment statement status report': 'status-report'
    }
  }
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
