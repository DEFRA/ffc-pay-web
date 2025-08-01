const config = require('../config')
const { schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const { getPaymentsByScheme } = require('../payments')
const { get } = require('../api')
const HTTP_STATUS = require('../constants/http-status-codes')
const ERROR_VIEWS = require('../constants/error-views')

module.exports = [
  {
    method: 'GET',
    path: '/monitoring/schemes',
    options: {
      auth: { scope: [schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (_request, h) => {
      if (!config.useV2Events) {
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
      const schemes = await get('/payment-schemes')
      return h.view('monitoring/schemes', {
        data: schemes?.payload?.paymentSchemes
      })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/view-processed-payment-requests',
    options: {
      auth: { scope: [schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (request, h) => {
      if (!config.useV2Events) {
        console.warn('V2 events are not enabled, cannot view processed payment requests')
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
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
