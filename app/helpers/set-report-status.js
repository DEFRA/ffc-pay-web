const { set } = require('../cache')

const setReportStatus = async (request, jobId, { status, reportType, returnedFilename, reportFilename }) => {
  const data = {
    status,
    ...(returnedFilename !== undefined && { returnedFilename }),
    ...(reportFilename !== undefined && { reportFilename }),
    ...(reportType !== undefined && { reportType })
  }

  return set(request, jobId, data)
}

module.exports = setReportStatus
