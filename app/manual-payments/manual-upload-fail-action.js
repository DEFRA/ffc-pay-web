const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const { MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const HTTP_STATUS = require('../constants/http-status-codes')

const manualUploadFailAction = async (request, h, error) => {
  const crumb = request.payload?.crumb ?? request.state.crumb

  if (error?.output?.statusCode === HTTP_STATUS.CONTENT_TOO_LARGE) {
    return h
      .view(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
        errors: { details: [{ message: `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.` }] },
        crumb
      })
      .code(HTTP_STATUS.BAD_REQUEST)
      .takeover()
  }

  return h
    .view(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
      errors: error,
      crumb
    })
    .code(HTTP_STATUS.BAD_REQUEST)
    .takeover()
}

module.exports = { manualUploadFailAction }
