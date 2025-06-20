const reportListPath = '/report-list'
const buildDownload = (path) => `${path}/download`

const basePaths = {
  PAYMENT_REQUESTS: `${reportListPath}/payment-requests`,
  PAYMENT_REQUESTS_V2: `${reportListPath}/payment-requests-v2`,
  TRANSACTION_SUMMARY: `${reportListPath}/transaction-summary`,
  CLAIM_LEVEL_REPORT: `${reportListPath}/claim-level-report`,
  REQUEST_EDITOR_REPORT: `${reportListPath}/request-editor-report`,
  SUPPRESSED_PAYMENTS: `${reportListPath}/suppressed-payments`,
  HOLDS: `${reportListPath}/holds`,
  AP_AR: `${reportListPath}/ap-ar-report`,
  REPORT_UNAVAILABLE: '/report-unavailable'
}

module.exports = {
  ...basePaths,
  PAYMENT_REQUESTS_V2_DOWNLOAD: buildDownload(basePaths.PAYMENT_REQUESTS_V2),
  TRANSACTION_SUMMARY_DOWNLOAD: buildDownload(basePaths.TRANSACTION_SUMMARY),
  CLAIM_LEVEL_REPORT_DOWNLOAD: buildDownload(basePaths.CLAIM_LEVEL_REPORT),
  AP_AR_DOWNLOAD: buildDownload(basePaths.AP_AR)
}
