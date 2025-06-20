const { readFileContent } = require('../helpers/read-file-content')
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
          if (errors instanceof Error && errors.name === 'ValidationError') {
            console.warn(`Validation error for job ${jobId}:`, errors)
            return setLoadingStatus(request, jobId, {
              status: 'failed',
              message: errors._original?.frn
                ? `There was a problem validating your uploaded data. The FRN, "${errors._original.frn}" is invalid. Please check your file and try again.`
                : `There was a problem validating your uploaded data: ${errors.details.map(detail => detail.message).join(', ')}. Please check your file and try again.`
            })
          } else {
            console.error(`Errors processing hold data for job ${jobId}:`, errors)
            return setLoadingStatus(request, jobId, {
              status: 'failed',
              message: `An error occurred while processing the data: ${errors.details.map(detail => detail.message).join(', ')}`
            })
          }
        }
        return processUpload(request, jobId, uploadData)
      })
      .catch((err) => {
        console.error(`Error generating report ${jobId}:`, err)
        return setLoadingStatus(request, jobId, {
          status: 'failed',
          message: `An error occurred while processing the data: ${err.message}`
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
