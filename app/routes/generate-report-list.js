const { applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked } = require('../auth/permissions')
const { generateReportTypes } = require('../helpers/generate-report-types')
const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked] }

module.exports = {
  method: 'GET',
  path: '/generate-report-list',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      const reportTypes = generateReportTypes()
      const reportTypesKeys = Object.keys(reportTypes)

      return h.view('generate-report-list', {
        reportTypes: reportTypesKeys,
        reportTypesRoutes: reportTypes,
        totalReportTypes: reportTypesKeys.length
      })
    }
  }
}
