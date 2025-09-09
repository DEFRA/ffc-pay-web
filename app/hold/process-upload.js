const { postProcessing } = require('../api')
const { setLoadingStatus } = require('../helpers/set-loading-status')

const ENDPOINTS = {
  REMOVE: '/payment-holds/bulk/remove',
  ADD: '/payment-holds/bulk/add'
}

const processUpload = async (request, jobId, uploadData) => {
  const endpoint = request.payload.remove ? ENDPOINTS.REMOVE : ENDPOINTS.ADD
  const payload = {
    data: uploadData,
    holdCategoryId: request.payload.holdCategoryId
  }

  await postProcessing(endpoint, payload, null)
  return setLoadingStatus(request, jobId, { status: 'completed' })
}

module.exports = { processUpload }
