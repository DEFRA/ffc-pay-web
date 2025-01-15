const { post } = require('../api')
const { getHoldCategories } = require('../holds')
const { readFileContent } = require('./read-file-content')
const { processHoldData } = require('./process-hold-data')
const HTTP_BAD_REQUEST = 400

const handleBulkPost = async (request, h) => {
  const data = readFileContent(request.payload.file.path)
  if (!data) {
    const { schemes, paymentHoldCategories } = await getHoldCategories()
    return h.view('payment-holds/bulk', { schemes, paymentHoldCategories, errors: { details: [{ message: 'An error occurred whilst reading the file' }] } }).code(HTTP_BAD_REQUEST).takeover()
  }
  const { uploadData, errors } = await processHoldData(data)
  if (errors) {
    const { schemes, paymentHoldCategories } = await getHoldCategories()
    return h.view('payment-holds/bulk', { schemes, paymentHoldCategories, errors }).code(HTTP_BAD_REQUEST).takeover()
  }
  if (request.payload.remove) {
    await post('/payment-holds/bulk/remove', { data: uploadData, holdCategoryId: request.payload.holdCategoryId }, null)
  } else {
    await post('/payment-holds/bulk/add', { data: uploadData, holdCategoryId: request.payload.holdCategoryId }, null)
  }
  return h.redirect('/payment-holds')
}

module.exports = {
  handleBulkPost
}
