const generateReportListPath = '/generate-report-list'
const buildDownload = (path) => `${path}/download`

const basePaths = {
  AP_AR: `${generateReportListPath}/generate-ap-ar-listing-report`,
  PAYMENT_REQUESTS_V2: `${generateReportListPath}/generate-payment-request-statuses`,
  STATUS: `${generateReportListPath}/find-payment-statement-status-report`,
  STATUS_SEARCH: `${generateReportListPath}/find-payment-statement-status-report/search`
}

module.exports = {
  ...basePaths,
  AP_AR_DOWNLOAD: buildDownload(basePaths.AP_AR),
  PAYMENT_REQUESTS_V2_DOWNLOAD: buildDownload(basePaths.PAYMENT_REQUESTS_V2),
  STATUS_DOWNLOAD: buildDownload(basePaths.STATUS)
}
