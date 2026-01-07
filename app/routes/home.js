const config = require('../config')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin } = require('../auth/permissions')
const { getReportTypes } = require('../helpers/get-report-types')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin] }

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      const reportTypes = Object.keys(getReportTypes())
      return h.view('home', {
        reportTypes,
        manualPaymentsActive: config.manualPaymentsActive
      })
    }
  }
}
