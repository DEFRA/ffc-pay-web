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
      try {
        const processedPaymentRequests = await getPaymentsByScheme(schemeId)
        return h.view('monitoring/view-processed-payment-requests', {
          data: processedPaymentRequests
        })
      } catch (err) {
        return h
          .view('monitoring/schemes', {
            error: err.data?.payload?.message ?? err.message,
            schemeId
          })
          .code(HTTP_STATUS.PRECONDITION_FAILED)
      }
    }
  }
]
