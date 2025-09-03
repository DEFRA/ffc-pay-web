const { v4: uuidv4 } = require('uuid')

const MANUAL_PAYMENT_VIEWS = require('../constants/manual-payment-views')

const { readFileContent } = require('../helpers/read-file-content')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { manualUploadFailAction } = require('./manual-upload-fail-action')
const { uploadManualPaymentFile } = require('../storage')

const handleManualPaymentPost = async (request, h) => {
  try {
    const jobId = uuidv4()
    const filePath = request.payload.file.path
    const fileName = request.payload.file.filename

    const fileContent = readFileContent(filePath)
    if (!fileContent) {
      return await manualUploadFailAction(h)
    }

    await setLoadingStatus(request, jobId, { status: 'processing' })

    

    uploadManualPaymentFile(filePath, fileName).then(() => {
      setLoadingStatus(request, jobId, { status: 'completed' })
    }).catch((err) => {
      console.error('Error uploading manual payment file:', err)
      setLoadingStatus(request, jobId, { status: 'failed', message: err.message })
    })

    return h.view(MANUAL_PAYMENT_VIEWS.LOADING, { jobId })
  } catch (err) {
    console.error('Unexpected error in handleManualPaymentPost:', err)
    return manualUploadFailAction(h)
  }
}

module.exports = {
  handleManualPaymentPost
}
