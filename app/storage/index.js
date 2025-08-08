const {
  uploadManualPaymentFile,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile
} = require('./pay-reports')

const {
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport
} = require('./doc-reports')

module.exports = {
  uploadManualPaymentFile,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport
}
