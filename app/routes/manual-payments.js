const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const MANUAL_PAYMENT_ROUTES = require('../constants/manual-payment-routes')
const fileSchema = require('./schemas/manual-payment-file-schema')

const { manualUploadFailAction } = require('../manual-payments/manual-upload-fail-action')
const { handleManualPaymentPost } = require('../manual-payments')

const { MAX_BYTES } = require('../constants/payload-sizes')
const { holdAdmin } = require('../auth/permissions')

module.exports = [
  {
    method: 'GET',
    path: MANUAL_PAYMENT_ROUTES.MANUAL_PAYMENTS,
    options: {
      auth: { scope: [holdAdmin] },
      handler: async (_request, h) => {
        return h.view(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS)
      }
    }
  },
  {
    method: 'POST',
    path: MANUAL_PAYMENT_ROUTES.UPLOAD,
    handler: handleManualPaymentPost,
    options: {
      auth: { scope: [holdAdmin] },
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, error) => {
          return manualUploadFailAction(request, h, error)
        }
      },
      validate: {
        payload: fileSchema,
        failAction: async (request, h, error) => {
          return manualUploadFailAction(request, h, error)
        }
      }
    }
  }
]
