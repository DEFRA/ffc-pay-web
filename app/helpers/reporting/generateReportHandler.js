const { v4: uuidv4 } = require('uuid')
const setReportStatus = require('../set-report-status')
const { buildReportUrl } = require('../build-query-url')
const { queryTrackingApi } = require('../query-tracking-api')
const { normalisePayload } = require('../normalise-payload')

const generateReportHandler = (reportTypeParam, generateFinalFilenameFunc) => {
  return async (request, h) => {
    const jobId = uuidv4()
    const { payload } = request

    const reportTitle = payload['report-title']
    const reportUrl = payload['report-url']

    // All other reports will have their report type passed as a param, except AP and AR Reports.
    const reportType = reportTypeParam ?? payload['report-type']

    const normalisedPayload = normalisePayload(payload)

    const url = buildReportUrl(reportType, normalisedPayload)

    setReportStatus(request, jobId, {
      status: 'pending',
      reportType
    })

    queryTrackingApi(url)
      .then((returnedFilename) => {
        return setReportStatus(request, jobId, {
          status: 'ready',
          reportType,
          returnedFilename,
          reportFilename: generateFinalFilenameFunc(normalisedPayload)
        })
      })
      .catch((err) => {
        console.error(`Error generating report ${jobId}:`, err)
        return setReportStatus(request, jobId, {
          status: 'failed'
        })
      })

    return h.view('report-list/download-progress', {
      jobId,
      reportTitle,
      reportUrl
    })
  }
}

module.exports = {
  generateReportHandler
}
