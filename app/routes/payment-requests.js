const { postProcessing } = require('../api')
const schema = require('./schemas/invoice-number')
const { BAD_REQUEST, PRECONDITION_FAILED } = require('../constants/http-status-codes')
const { applicationAdmin, schemeAdmin } = require('../auth/permissions')
const ROUTES = {
  RESET: '/payment-request/reset',
  RESET_SUCCESS: '/payment-request/reset-success'
}
const VIEWS = {
  RESET: 'reset-payment-request',
  RESET_SUCCESS: 'reset-payment-request-success'
}

const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin] }

module.exports = [
  {
    method: 'GET',
    path: ROUTES.RESET,
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        return h.view(VIEWS.RESET)
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.RESET,
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          return h
            .view(VIEWS.RESET, {
              error,
              invoiceNumber: request.payload.invoiceNumber
            })
            .code(BAD_REQUEST)
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
            .code(PRECONDITION_FAILED)
            .takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: ROUTES.RESET_SUCCESS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        return h.view(VIEWS.RESET_SUCCESS, {
          invoiceNumber: request.query.invoiceNumber
        })
      }
    }
  }
]
