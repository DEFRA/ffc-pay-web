const { set } = require('../cache')

const setReportStatus = async (request, jobId, { status, message, reportType, returnedFilename, reportFilename, schemeName }) => {
  const data = {
    status,
    ...(message !== undefined && { message }),
    ...(returnedFilename !== undefined && { returnedFilename }),
    ...(reportFilename !== undefined && { reportFilename }),
    ...(reportType !== undefined && { reportType }),
    ...(schemeName !== undefined && { schemeName })
  }

  return set(request, jobId, data)
}

module.exports = setReportStatus
