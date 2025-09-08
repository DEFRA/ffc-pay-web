const { v4: uuidv4 } = require('uuid')

const { MANUAL_UPLOAD } = require('../constants/injection-routes')
const { SUCCESS } = require('../constants/http-status-codes')
const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const MANUAL_UPLOAD_RESPONSE_MESSAGES = require('../constants/manual-upload-response-messages')

const { readFileContent } = require('../helpers/read-file-content')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { manualUploadFailAction } = require('./manual-upload-fail-action')
const { uploadManualPaymentFile } = require('../storage')
const { postInjection } = require('../api')

const handleManualPaymentPost = async (request, h) => {
  const jobId = uuidv4()
  const { path: filePath, filename } = request.payload.file
  const user = request.auth?.credentials
  const uploaderNameOrEmail = user?.name || user?.email || 'Unknown User'

  const fileContent = readFileContent(filePath)

  if (!fileContent) {
    await setLoadingStatus(request, jobId, {
      status: 'failed',
      message: 'File empty'
    })
    return manualUploadFailAction(h)
  }

  return processManualPaymentFile(request, h, { filePath, filename, uploaderNameOrEmail, jobId })
}

async function processManualPaymentFile (request, h, { filePath, filename, uploaderNameOrEmail, jobId }) {
  try {
    await setLoadingStatus(request, jobId, { status: 'processing' })

    await uploadManualPaymentFile(filePath, filename)

    const response = await postInjection(MANUAL_UPLOAD, { uploader: uploaderNameOrEmail, filename }, null)

    const statusCode = response?.statusCode
    const message = MANUAL_UPLOAD_RESPONSE_MESSAGES[statusCode] || response?.payload.message || 'Unknown error occurred'
    const status = statusCode === SUCCESS ? 'completed' : 'failed'

    await setLoadingStatus(request, jobId, { status, message })
  } catch (err) {
    console.error('Error processing manual payment file:', err?.data?.payload || err)

    const statusCode = err?.data?.res?.statusCode || 'UNKNOWN_ERROR'
    const message =
      MANUAL_UPLOAD_RESPONSE_MESSAGES[statusCode] ||
      err?.data?.payload?.message ||
      err.message ||
      'Unknown error occurred'

    await setLoadingStatus(request, jobId, { status: 'failed', message })
  }

  return h.view(MANUAL_PAYMENT_VIEWS.LOADING, { jobId })
}

module.exports = {
  handleManualPaymentPost
}
