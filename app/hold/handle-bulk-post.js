const { readFileContent } = require('./read-file-content')
const { handleFileError } = require('./handle-error')
const { processHoldData } = require('./process-hold-data')
const { processUpload } = require('./process-upload')
const { setLoadingStatus } = require('../helpers/set-loading-status')
const { v4: uuidv4 } = require('uuid')

const HOLDS_VIEWS = require('../constants/holds-views')

const handleBulkPost = async (request, h) => {
  try {
    const jobId = uuidv4()
    const fileContent = readFileContent(request.payload.file.path)

    if (!fileContent) {
      return await handleFileError(h)
    }

    await setLoadingStatus(request, jobId, { status: 'processing' })

    processHoldData(fileContent)
      .then(async ({ uploadData, errors }) => {
        if (errors) {
          console.error(`Errors processing hold data for job ${jobId}:`, errors)
          return setLoadingStatus(request, jobId, {
            status: 'failed',
            errors
          })
        }
        return processUpload(request, jobId, uploadData)
      })
      .catch((err) => {
        console.error(`Error generating report ${jobId}:`, err)
        return setLoadingStatus(request, jobId, {
          status: 'failed',
          errors: [{
            message: `An error occurred while processing the data: ${err.message}`
          }]
        })
      })

    return h.view(HOLDS_VIEWS.LOADING, { jobId })
  } catch (err) {
    console.error('Unexpected error in handleBulkPost:', err)
    return handleFileError(h)
  }
}

module.exports = {
  handleBulkPost
}
