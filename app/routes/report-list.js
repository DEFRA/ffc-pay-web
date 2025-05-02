const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const { getReportTypes } = require('../constants/get-report-types')
const { getHolds } = require('../holds')

module.exports = {
  method: 'GET',
  path: '/report-list',
  options: {
    auth: { scope: [holdAdmin, schemeAdmin, dataView] },
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
