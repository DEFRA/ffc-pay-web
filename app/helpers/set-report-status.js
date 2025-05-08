const { set } = require('../cache')

const setReportStatus = async (request, jobId, { status, reportType, returnedFilename, reportFilename }) => {
  const data = { status }

  if (returnedFilename !== undefined) data.returnedFilename = returnedFilename
  if (reportFilename !== undefined) data.reportFilename = reportFilename
  if (reportType !== undefined) data.reportType = reportType

  await set(request, jobId, data)
}

module.exports = setReportStatus
