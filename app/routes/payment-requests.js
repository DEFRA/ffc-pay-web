const { post } = require('../api')
const schema = require('./schemas/invoice-number')
const { schemeAdmin } = require('../auth/permissions')
const ROUTES = {
  RESET: '/payment-request/reset',
  RESET_SUCCESS: '/payment-request/reset-success'
}
const VIEWS = {
  RESET: 'reset-payment-request',
  RESET_SUCCESS: 'reset-payment-request-success'
}
const HTTP = {
  BAD_REQUEST: 400,
  PRECONDITION_FAILED: 412
}

module.exports = [
  {
    method: 'GET',
    path: ROUTES.RESET,
    options: {
      auth: { scope: [schemeAdmin] },
      handler: async (_request, h) => {
        return h.view(VIEWS.RESET)
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.RESET,
    options: {
      auth: { scope: [schemeAdmin] },
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          return h
            .view(VIEWS.RESET, {
              error,
              invoiceNumber: request.payload.invoiceNumber
            })
            .code(HTTP.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { invoiceNumber } = request.payload
        try {
          await postProcessing(ROUTES.RESET, { invoiceNumber })
          return h.redirect(
            `/payment-request/reset-success?invoiceNumber=${invoiceNumber}`
          )
        } catch (err) {
          return h
            .view(VIEWS.RESET, {
              error: err.data?.payload?.message ?? err.message,
              invoiceNumber
            })
            .code(HTTP.PRECONDITION_FAILED)
            .takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: ROUTES.RESET_SUCCESS,
    options: {
      auth: { scope: [schemeAdmin] },
      handler: async (request, h) => {
        return h.view(VIEWS.RESET_SUCCESS, {
          invoiceNumber: request.query.invoiceNumber
        })
      }
    }
  }
]
