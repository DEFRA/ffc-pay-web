const reportTypes = require('./report-types')

module.exports = {
  [reportTypes.PAYMENT_REQUEST_STATUSES]: '/payment-requests-report',
  [reportTypes.PAYMENT_REQUEST_STATUSES_V2]: '/payment-requests-report',
  [reportTypes.COMBINED_TRANSACTION]: '/transaction-summary',
  [reportTypes.REQUEST_EDITOR]: '/request-editor-report',
  [reportTypes.CLAIM_LEVEL]: '/claim-level-report',
  [reportTypes.AP]: '/ap-report-data',
  [reportTypes.AR]: '/ar-report-data'
}
