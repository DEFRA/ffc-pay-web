const { getHoldCategories } = require('../holds')
const { mapHoldCategoriesToRadios } = require('../hold')
const { MAX_MEGA_BYTES } = require('../constants/payload-sizes')
const HTTP_STATUS = require('../constants/http-status-codes')
const BULK = 'payment-holds/bulk'

const bulkFailAction = async (request, h, error) => {
  const { schemes, paymentHoldCategories } = await getHoldCategories()

  const holdCategoryRadios = mapHoldCategoriesToRadios(schemes, paymentHoldCategories, {
    valueKey: 'holdCategoryId',
    textKey: 'name'
  })

  // Try getting the crumb from request.payload and fallback to the crumb in state
  const crumb = request.payload?.crumb ?? request.state.crumb

  if (error?.output?.statusCode === HTTP_STATUS.CONTENT_TOO_LARGE) {
    return h
      .view(BULK, {
        holdCategoryRadios,
        errors: { details: [{ message: `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.` }] },
        crumb
      })
      .code(HTTP_STATUS.BAD_REQUEST)
      .takeover()
  }

  return h
    .view(BULK, {
      holdCategoryRadios,
      errors: error,
      crumb
    })
    .code(HTTP_STATUS.BAD_REQUEST)
    .takeover()
}

module.exports = { bulkFailAction }
