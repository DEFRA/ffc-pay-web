const { v4: uuidv4 } = require('uuid')
const Boom = require('@hapi/boom')

const { MANUAL_UPLOAD } = require('../constants/injection-routes')
const { SUCCESS, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } = require('../constants/http-status-codes')
const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const MANUAL_UPLOAD_RESPONSE_MESSAGES = require('../constants/manual-payment-response-messages')

const { readFileContent } = require('../helpers/read-file-content')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { isTextWhitespace } = require('../helpers/is-text-whitespace')
const { manualPaymentUploadFailAction } = require('./manual-payment-fail-action')
const { uploadManualPaymentFile } = require('../storage')
const { postInjection } = require('../api')

const handleManualPaymentUploadPost = async (request, h) => {
  const jobId = uuidv4()
  const { path: filePath, filename } = request.payload.file
  const user = request.auth?.credentials.account

  const uploaderNameOrEmail = user?.name || user?.username || user?.email

  console.log(`User ${uploaderNameOrEmail} is uploading file: ${filename}`)

  const fileContent = readFileContent(filePath)

  if (isTextWhitespace(fileContent)) {
    await setLoadingStatus(request, jobId, {
      status: 'failed',
      message: 'File empty'
    })
    return manualPaymentUploadFailAction(request, h, Boom.boomify(new Error('File is empty'), { statusCode: UNPROCESSABLE_CONTENT }))
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
    console.log(statusCode === SUCCESS ? 'Manual payment file uploaded successfully' : `Manual payment file upload failed with code ${statusCode}`, message)
  } catch (err) {
    console.error('Error uploading manual payment file:', err?.data?.payload || err)

    const statusCode = err?.output?.statusCode || err?.output?.payload.statusCode || INTERNAL_SERVER_ERROR

    const message =
      MANUAL_UPLOAD_RESPONSE_MESSAGES[statusCode] ||
      err?.data?.payload?.message ||
      err.message || 'Unknown error occurred'

    await setLoadingStatus(request, jobId, { status: 'failed', message })
  }

  return h.view(MANUAL_PAYMENT_VIEWS.LOADING, { jobId })
}

module.exports = {
  handleManualPaymentUploadPost
}
