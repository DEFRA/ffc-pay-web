const {
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
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport
}
