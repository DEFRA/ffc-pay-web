const REPORT_TYPES = require('./report-types')

module.exports = {
  [REPORT_TYPES.PAYMENT_REQUEST_STATUSES]: '/payment-requests-report',
  [REPORT_TYPES.COMBINED_TRANSACTION]: '/transaction-summary',
  [REPORT_TYPES.CLAIM_LEVEL]: '/claim-level-report',
  [REPORT_TYPES.REQUEST_EDITOR]: '/request-editor-report',
  [REPORT_TYPES.AP]: '/ap-report-data',
  [REPORT_TYPES.AR]: '/ar-report-data'
}
