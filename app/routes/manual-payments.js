const { manualPaymentUploadFailAction } = require('../manual-payments/manual-payment-fail-action')
const { handleManualPaymentUploadPost } = require('../manual-payments')
const { getHistoricalInjectionData } = require('../api')

const { MAX_BYTES } = require('../constants/payload-sizes')
const { applicationAdmin, manualPaymentsAdmin } = require('../auth/permissions')

const fileSchema = require('./schemas/manual-payment-file-schema')
const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const MANUAL_PAYMENT_ROUTES = require('../constants/manual-payment-routes')
const { MANUAL_UPLOAD_AUDIT } = require('../constants/injection-routes')
const AUTH_SCOPE = { scope: [applicationAdmin, manualPaymentsAdmin] }

function formatDateTime (value) {
  if (!value) { return 'Unknown' }

  const date = new Date(value)

  if (isNaN(date)) { return 'Invalid date' }

  return date.toISOString().slice(0, 16).replace('T', ' - ')
}

module.exports = [
  {
    method: 'GET',
    path: MANUAL_PAYMENT_ROUTES.MANUAL_PAYMENTS,
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
        const user = request.auth?.credentials.account
        const uploaderNameOrEmail = user?.name || user?.username || user?.email
        console.log(`User ${uploaderNameOrEmail} accessed the upload page.`)

        let uploadHistory = []

        try {
          const { payload } = await getHistoricalInjectionData(MANUAL_UPLOAD_AUDIT, 60)
          console.log(`Retrieved ${payload?.length || 0} uploads`)

          uploadHistory = (payload || []).map(upload => ({
            ...upload,
            timeStamp: formatDateTime(upload.timeStamp)
          }))
        } catch (err) {
          console.error('Failed to fetch upload history:', err)
        }

        return h.view(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, { uploadHistory })
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
