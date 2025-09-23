const config = require('../config')
const { schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const {
  getPaymentsByFrn,
  getPaymentsByCorrelationId,
  getPaymentsByBatch
} = require('../payments')
const ViewModel = require('./models/monitoring')
const HTTP_STATUS = require('../constants/http-status-codes')
const ERROR_VIEWS = require('../constants/error-views')

module.exports = [
  {
    method: 'GET',
    path: '/monitoring',
    options: {
      auth: { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (_request, h) => {
      if (!config.useV2Events) {
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
      return h.view('monitoring/monitoring', new ViewModel())
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/frn',
    options: {
      auth: { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (request, h) => {
      if (!config.useV2Events) {
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
      const frn = request.query.frn
      const payments = await getPaymentsByFrn(frn)
      return h.view('monitoring/frn', { frn, payments })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/correlation-id',
    options: {
      auth: { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (request, h) => {
      if (!config.useV2Events) {
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
      const correlationId = request.query.correlationId
      const events = await getPaymentsByCorrelationId(correlationId)
      return h.view('monitoring/correlation-id', { correlationId, events })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/batch/name',
    options: {
      auth: { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }
    },
    handler: async (request, h) => {
      if (!config.useV2Events) {
        return h.view(ERROR_VIEWS.NOT_FOUND).code(HTTP_STATUS.NOT_FOUND)
      }
      const batch = request.query.batch
      const payments = await getPaymentsByBatch(batch)
      return h.view('monitoring/batch', { batch, payments })
    }
  }
]
