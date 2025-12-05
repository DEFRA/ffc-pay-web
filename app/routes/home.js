const config = require('../config')
const Boom = require('@hapi/boom')
const { getProcessingData, getAlertingData } = require('../api')
const { applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin } = require('../auth/permissions')
const { getReportTypes } = require('../helpers/get-report-types')

const AUTH_SCOPE = { scope: [applicationAdmin, holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin, alertAdmin] }

const handleAlertingError = (error) => {
  console.error('Alerting Service error:', error)
  return Boom.badGateway(`Alerting Service is unavailable: ${error.message}`)
}

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      try {
        const paymentHoldsResponse = await getProcessingData('/payment-holds')
        const schemes = await getProcessingData('/payment-schemes')
        const closures = await getProcessingData('/closures')
        const users = await getAlertingData('/contact-list')
        const reportTypes = Object.keys(getReportTypes())
        return h.view('home', {
          paymentHolds: paymentHoldsResponse?.payload?.paymentHolds ?? 0,
          schemes: schemes?.payload?.paymentSchemes ?? 0,
          closures: closures?.payload?.closures ?? 0,
          users: users?.payload?.contacts ?? 0,
          reportTypes,
          totalReportTypes: reportTypes.length,
          manualPaymentsActive: config.manualPaymentsActive
        })
      } catch (error) {
        return handleAlertingError(error)
      }
    }
  }
}
