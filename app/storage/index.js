const {
  getMIReport,
  getSuppressedReport,
  getDataRequestFile
} = require('./pay-reports')

const {
  getValidReportYears,
  getReportsByYearAndType,
  getStatusReport
} = require('./doc-reports')

module.exports = {
  getMIReport,
  getSuppressedReport,
  getDataRequestFile,
  getValidReportYears,
  getReportsByYearAndType,
  getStatusReport
}
