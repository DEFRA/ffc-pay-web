const { set } = require('../cache')

const setReportStatus = async (request, jobId, { status, message, reportType, returnedFilename, reportFilename }) => {
  const data = {
    status,
    ...(message !== undefined && { message }),
    ...(returnedFilename !== undefined && { returnedFilename }),
    ...(reportFilename !== undefined && { reportFilename }),
    ...(reportType !== undefined && { reportType })
  }

  return set(request, jobId, data)
}

module.exports = setReportStatus
