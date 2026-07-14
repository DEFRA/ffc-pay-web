const setReportStatus = require('../helpers/set-report-status')

const setStatusCallback = (request, jobId) => (errorMessage = null, statusOverride = null) => {
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
    status: 'completed'
  })
}

module.exports = {
  setStatusCallback
}
