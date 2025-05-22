const { getHoldCategories } = require('../holds')
const HTTP_STATUS = require('../constants/http-status')
const BULK = 'payment-holds/bulk'
const MAX_BYTES = 1048576

const bulkFailAction = async (request, h, error) => {
  const { schemes, paymentHoldCategories } = await getHoldCategories()
  const maxMB = MAX_BYTES / (1024 * 1024)

  // Try getting the crumb from request.payload and fallback to the crumb in state
  const crumb = (request.payload && request.payload.crumb) || request.state.crumb

  if (error && error.output && error.output.statusCode === 413) {
    return h
      .view(BULK, {
        schemes,
        paymentHoldCategories,
        errors: { details: [{ message: `The uploaded file is too large. Please upload a file smaller than ${maxMB} MB.` }] },
        crumb
      })
      .code(HTTP_STATUS.BAD_REQUEST)
      .takeover()
  }

  return h
    .view(BULK, {
      schemes,
      paymentHoldCategories,
      errors: error,
      crumb
    })
    .code(HTTP_STATUS.BAD_REQUEST)
    .takeover()
}

module.exports = { bulkFailAction }
