const { v4: uuidv4 } = require('uuid')

const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')
const { MANUAL_UPLOAD } = require('../constants/injection-routes')

const { readFileContent } = require('../helpers/read-file-content')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { manualUploadFailAction } = require('./manual-upload-fail-action')
const { uploadManualPaymentFile } = require('../storage')
const { postInjection } = require('../api')

const handleManualPaymentPost = async (request, h) => {
  const jobId = uuidv4()

  const filePath = request.payload.file.path
  const filename = request.payload.file.filename
  const user = request.auth?.credentials
  const uploaderNameOrEmail = user?.name || user?.email || 'Unknown User'

  const fileContent = readFileContent(filePath)
  if (!fileContent) {
    await setLoadingStatus(request, jobId, { status: 'failed', message: 'File empty' })
    return manualUploadFailAction(h)
  }

  setLoadingStatus(request, jobId, { status: 'processing' })
    .then(() => uploadManualPaymentFile(filePath, filename))
    .then(() => postInjection(MANUAL_UPLOAD, { uploader: uploaderNameOrEmail, filename }, null))
    .then(() => setLoadingStatus(request, jobId, { status: 'completed' }))
    .catch((err) => {
      console.error('Error processing manual payment file:', err)

      let message = 'Unknown error'
      if (err.data && err.data.isResponseError && err.data.res) {
        try {
          const parsed = err.data.payload || JSON.parse(err.data.body || '{}')
          message = parsed.error || JSON.stringify(parsed)
        } catch (parseErr) {
          message = err.message
        }
      } else {
        message = err.message
      }

      setLoadingStatus(request, jobId, { status: 'failed', message })
    })

  return h.view(MANUAL_PAYMENT_VIEWS.LOADING, { jobId })
}

module.exports = {
  handleManualPaymentPost
}
