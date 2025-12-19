const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../auth/permissions')
const {
  getPaymentsByFrn,
  getPaymentsByCorrelationId,
  getPaymentsByBatch
} = require('../payments')

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] }

module.exports = [
  {
    method: 'GET',
    path: '/monitoring',
    options: {
      auth: AUTH_SCOPE
    },
    handler: async (request, h) => {
      const error = request.query.error
      if (error) {
        return h.view('monitoring/monitoring', { error: 'Exactly one of FRN and batch name should be provided' })
      }
      return h.view('monitoring/monitoring')
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
      if (!frn) {
        return h.redirect('/monitoring?error=true')
      }
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
      if (!batch) {
        return h.redirect('/monitoring?error=true')
      }
      const payments = await getPaymentsByBatch(batch)
      return h.view('monitoring/batch', { batch, payments })
    }
  }
]
