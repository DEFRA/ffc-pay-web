const config = require('../config')
const { getProcessingData, getAlertingData } = require('../api')
const { getReportTypes } = require('../helpers/get-report-types')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: async (_request, h) => {
      const paymentHoldsResponse = await getProcessingData('/payment-holds')
      const schemes = await getProcessingData('/payment-schemes')
      const closures = await getProcessingData('/closures')
      const users = await getAlertingData('/contact-list')
      const reportTypes = Object.keys(getReportTypes())
      return h.view('home', {
        totalReportTypes: reportTypes.length,
        totalHolds: paymentHoldsResponse?.payload?.paymentHolds?.filter(x => x.dateTimeClosed == null).length ?? 0,
        totalSchemes: schemes?.payload?.paymentSchemes?.length ?? 0,
        totalClosures: closures?.payload?.closures?.length ?? 0,
        totalAlertUsers: users?.payload?.contacts?.length ?? 0,
        manualPaymentsActive: config.manualPaymentsActive
      })
    }
  }
}
