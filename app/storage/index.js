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

const {
  searchStatements,
  downloadStatement
} = require('./statement-search')

module.exports = {
  uploadManualPaymentFile,
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport,
  searchStatements,
  downloadStatement
}
