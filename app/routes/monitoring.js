const config = require('../config')
const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const {
  getPaymentsByFrn,
  getPaymentsByCorrelationId,
  getPaymentsByBatch
} = require('../payments')
const ViewModel = require('./models/monitoring')

const HTTP_STATUS = require('../constants/http-status-codes')
const ERROR_VIEWS = require('../constants/error-views')
const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: '/monitoring',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (_request, h) => {
      return h.view('monitoring/monitoring', new ViewModel())
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/frn',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const frn = request.query.frn
      const payments = await getPaymentsByFrn(frn)
      return h.view('monitoring/frn', { frn, payments })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/payments/correlation-id',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const correlationId = request.query.correlationId
      const events = await getPaymentsByCorrelationId(correlationId)
      return h.view('monitoring/correlation-id', { correlationId, events })
    }
  },
  {
    method: 'GET',
    path: '/monitoring/batch/name',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const batch = request.query.batch
      const payments = await getPaymentsByBatch(batch)
      return h.view('monitoring/batch', { batch, payments })
    }
  }
]
