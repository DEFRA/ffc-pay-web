const config = require('../config')
const { getProcessingData } = require('../api')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin } = require('../auth/permissions')
const { getReportTypes } = require('../helpers/get-report-types')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin] }

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      const paymentHoldsResponse = await getProcessingData('/payment-holds')
      const schemes = await getProcessingData('/payment-schemes')
      const closures = await getProcessingData('/closures')
      const reportTypes = Object.keys(getReportTypes())
      return h.view('home', {
        totalReportTypes: reportTypes.length,
        totalHolds: paymentHoldsResponse?.payload?.paymentHolds?.filter(x => x.dateTimeClosed == null).length ?? 0,
        totalSchemes: schemes?.payload?.paymentSchemes?.length ?? 0,
        totalClosures: closures?.payload?.closures?.length ?? 0,
        manualPaymentsActive: config.manualPaymentsActive
      })
    }
  }
}
