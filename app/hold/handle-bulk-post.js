const { post } = require('../api')
const { getHoldCategories } = require('../holds')
const { readFileContent } = require('./read-file-content')
const { processHoldData } = require('./process-hold-data')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { BAD_REQUEST } = require('../constants/http-status')
const { v4: uuidv4 } = require('uuid')

const handleBulkPost = async (request, h) => {
  const jobId = uuidv4()
  const data = readFileContent(request.payload.file.path)
  if (!data) {
    const { schemes, paymentHoldCategories } = await getHoldCategories()
    return h.view('payment-holds/bulk', { schemes, paymentHoldCategories, errors: { details: [{ message: 'An error occurred whilst reading the file' }] } }).code(BAD_REQUEST).takeover()
  }

  processHoldData(data)
    .then(async ({ uploadData, errors }) => {
      if (errors) {
        return setLoadingStatus(request, jobId, { status: 'failed', errors })
      }
      if (request.payload.remove) {
        await post('/payment-holds/bulk/remove', { data: uploadData, holdCategoryId: request.payload.holdCategoryId }, null)
      } else {
        await post('/payment-holds/bulk/add', { data: uploadData, holdCategoryId: request.payload.holdCategoryId }, null)
      }
      return setLoadingStatus(request, jobId, { status: 'completed' })
    })
    .catch((err) => {
      console.error(`Error generating report ${jobId}:`, err)
      return setLoadingStatus(request, jobId, { status: 'failed', errors: [{ message: `An error occurred while processing the data, ${err.message}` }] })
    })

  return h.view('payment-holds/holds-loading', {
    jobId
  })
}

module.exports = {
  handleBulkPost
}
