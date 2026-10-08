const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const { getPaymentsByScheme } = require('../payments')

const HTTP_STATUS = require('../constants/http-status-codes')
const { getSchemes } = require('../helpers')
const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
const monitorSchemesPath = 'monitoring/schemes'

module.exports = [
  {
    method: 'GET',
    path: '/monitoring/schemes',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (_request, h) => {
      const schemes = getSchemes()
      return h.view(monitorSchemesPath, {
        data: schemes
      })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/view-processed-payment-requests',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const { schemeId } = request.query

      if (!schemeId) {
        const schemes = getSchemes()
        return h
          .view(monitorSchemesPath, {
            error: 'Select a scheme',
            data: schemes?.payload?.paymentSchemes
          })
          .code(HTTP_STATUS.PRECONDITION_FAILED)
      }

      try {
        const processedPaymentRequests = await getPaymentsByScheme(schemeId)
        return h.view('monitoring/view-processed-payment-requests', {
          data: processedPaymentRequests
        })
      } catch (err) {
        const schemes = getSchemes()
        return h
          .view(monitorSchemesPath, {
            error: err.data?.payload?.message ?? err.message,
            schemeId,
            data: schemes?.payload?.paymentSchemes
          })
          .code(HTTP_STATUS.PRECONDITION_FAILED)
      }
    }
  }
]
