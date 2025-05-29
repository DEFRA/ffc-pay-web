const { BAD_REQUEST } = require('../constants/http-status')
const HOLDS_VIEWS = require('../constants/holds-views')
const { getHoldCategories } = require('../holds')

const handleFileError = async (h) => {
  const { schemes, paymentHoldCategories } = await getHoldCategories()
  return h
    .view(HOLDS_VIEWS.BULK, {
      schemes,
      paymentHoldCategories,
      errors: {
        details: [{
          message: 'An error occurred whilst reading the file'
        }]
      }
    })
    .code(BAD_REQUEST)
    .takeover()
}

module.exports = { handleFileError }
