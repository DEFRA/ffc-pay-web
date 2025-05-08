const { set } = require('../cache')

const setReportStatus = async (request, jobId, { status, filename, reportType }) => {
  const data = { status }

  if (filename !== undefined) data.filename = filename
  if (reportType !== undefined) data.reportType = reportType

  await set(request, jobId, data)
}

module.exports = setReportStatus
