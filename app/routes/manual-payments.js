const { manualPaymentUploadFailAction } = require('../manual-payments/manual-payment-fail-action')
const { handleManualPaymentUploadPost } = require('../manual-payments')

const { MAX_BYTES } = require('../constants/payload-sizes')
const { applicationAdmin, manualPaymentsAdmin } = require('../auth/permissions')

const fileSchema = require('./schemas/manual-payment-file-schema')
const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const MANUAL_PAYMENT_ROUTES = require('../constants/manual-payment-routes')
const AUTH_SCOPE = { scope: [applicationAdmin, manualPaymentsAdmin] }

module.exports = [
  {
    method: 'GET',
    path: MANUAL_PAYMENT_ROUTES.MANUAL_PAYMENTS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const user = request.auth?.credentials.account
        const uploaderNameOrEmail = user?.name || user?.username || user?.email
        console.log(`User ${uploaderNameOrEmail} has accessed the manual payments upload page.`)

        return h.view(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS)
      }
    }
  },
  {
    method: 'POST',
    path: MANUAL_PAYMENT_ROUTES.UPLOAD,
    handler: handleManualPaymentUploadPost,
    options: {
      auth: AUTH_SCOPE,
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, error) => {
          return manualPaymentUploadFailAction(request, h, error)
        }
      },
      validate: {
        payload: fileSchema,
        failAction: async (request, h, error) => {
          return manualPaymentUploadFailAction(request, h, error)
        }
      }
    }
  }
]
