const { MANUAL_PAYMENTS } = require('../constants/manual-payment-views')
const { MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const HTTP_STATUS = require('../constants/http-status-codes')

const manualPaymentUploadFailAction = async (request, h, error) => {
  const crumb = request.payload?.crumb ?? request.state.crumb

  if (error?.output?.statusCode === HTTP_STATUS.CONTENT_TOO_LARGE) {
    return h
      .view(MANUAL_PAYMENTS, {
        errors: { details: [{ path: 'payload', message: `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.` }] },
        crumb
      })
      .code(HTTP_STATUS.BAD_REQUEST)
      .takeover()
  }

  if (error?.output?.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
    return h
      .view(MANUAL_PAYMENTS, {
        errors: { details: [{ path: 'file-empty', message: 'We couldn’t process your upload because the file is empty. Please upload a file that contains data.' }] },
        crumb
      })
      .code(HTTP_STATUS.BAD_REQUEST)
      .takeover()
  }

  return h
    .view(MANUAL_PAYMENTS, {
      errors: error,
      crumb
    })
    .code(HTTP_STATUS.BAD_REQUEST)
    .takeover()
}

module.exports = { manualPaymentUploadFailAction }
