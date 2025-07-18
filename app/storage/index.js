const {
  getMIReport,
  getSuppressedReport,
  getDataRequestFile
} = require('./pay-reports')

const {
  getValidReportYears,
  getReportsByYearAndType,
  getStatusReport
} = require('./docs-reports')

module.exports = {
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getValidReportYears,
  getReportsByYearAndType,
  getStatusReport
}
