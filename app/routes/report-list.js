const { holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked } = require('../auth/permissions')
const { getReportTypes } = require('../helpers/get-report-types')
const { getHolds } = require('../holds')

module.exports = {
  method: 'GET',
  path: '/report-list',
  options: {
    auth: { scope: [holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked] },
    handler: async (_request, h) => {
      const reportTypes = getReportTypes()
      const reportTypesKeys = Object.keys(reportTypes)
      const totalHolds = await getHolds()

      return h.view('report-list', {
        reportTypes: reportTypesKeys,
        reportTypesRoutes: reportTypes,
        totalReportTypes: reportTypesKeys.length,
        totalHolds
      })
    }
  }
}
