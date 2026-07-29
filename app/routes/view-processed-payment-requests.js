const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const { getPaymentsByScheme } = require('../payments')
const { getProcessingData } = require('../api')

const HTTP_STATUS = require('../constants/http-status-codes')
const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: '/monitoring/schemes',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (_request, h) => {
      const schemes = await getProcessingData('/payment-schemes')
      return h.view('monitoring/schemes', {
        data: schemes?.payload?.paymentSchemes
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
        const schemes = await getProcessingData('/payment-schemes')
        return h
          .view('monitoring/schemes', {
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
        const schemes = await getProcessingData('/payment-schemes')
        return h
          .view('monitoring/schemes', {
            error: err.data?.payload?.message ?? err.message,
            schemeId,
            data: schemes?.payload?.paymentSchemes
          })
          .code(HTTP_STATUS.PRECONDITION_FAILED)
      }
    }
  }
]
