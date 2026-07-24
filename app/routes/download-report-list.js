const { applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked } = require('../auth/permissions')
const { downloadReportTypes } = require('../helpers/download-report-types')
const { generateReportTypes } = require('../helpers/generate-report-types')
const { getReportFileInfo } = require('../helpers/get-report-file-info')
const { getHolds } = require('../holds')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked] }

module.exports = {
  method: 'GET',
  path: '/download-report-list',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      const reportTypes = downloadReportTypes()
      const reportTypesKeys = Object.keys(reportTypes)
      const generateTypes = generateReportTypes()
      const generateTypesKeys = Object.keys(generateTypes)
      const fileInfo = getReportFileInfo()
      const totalHolds = (await getHolds()).length

      return h.view('download-report-list', {
        reportTypes: reportTypesKeys,
        reportTypesRoutes: reportTypes,
        generateReportTypes: generateTypesKeys,
        generateReportTypesRoutes: generateTypes,
        fileInfo,
        totalReportTypes: reportTypesKeys.length,
        totalHolds
      })
    }
  }
}
