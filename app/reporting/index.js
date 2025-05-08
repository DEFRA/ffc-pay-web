const { generateAPARReport } = require('./get-ap-ar-report')

const REPORT_TYPES = require('../constants/report-types')

const generateReportByType = async (reportType, filename) => {
  switch (reportType) {
    case REPORT_TYPES.REQUEST_EDITOR:
      break
    case REPORT_TYPES.CLAIM_LEVEL:
      break
    case REPORT_TYPES.AP || REPORT_TYPES.AR:
      return generateAPARReport(filename)
    default:
      throw new Error(`Report Type ${reportType} is not found within the REPORT_TYPES constants file.`)
  }
}

module.exports = generateReportByType
