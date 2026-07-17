const setReportStatus = require('../helpers/set-report-status')

const setStatusCallback = (request, jobId, reportContext = {}) => (errorMessage = null, statusOverride = null) => {
  if (statusOverride === 'no-results') {
    return setReportStatus(request, jobId, { status: 'no-results' })
  }
  if (errorMessage != null) {
    return setReportStatus(request, jobId, {
      status: 'failed',
      message: errorMessage || 'An error occurred while generating the report.'
    })
  }

  return setReportStatus(request, jobId, {
    status: 'completed',
    ...reportContext
  })
}

module.exports = {
  setStatusCallback
}
