const { v4: uuidv4 } = require('uuid')
const setReportStatus = require('./set-report-status')
const { buildReportUrl } = require('./build-query-url')
const { queryTrackingApi } = require('./query-tracking-api')
const { normaliseQuery } = require('./normalise-query')

const generateReportHandler = (reportTypeParam, generateFinalFilenameFunc, options = {}) => {
  return async (request, h) => {
    const jobId = uuidv4()
    const { query } = request

    const reportUrl = options.reportUrl ?? query['report-url']
    const reportTitle = options.reportTitle ?? query['report-title']

    // All other reports will have their report type passed as a param, except AP and AR Reports.
    const reportType = reportTypeParam ?? query['select-type']

    const normalisedQuery = normaliseQuery(query)

    const url = buildReportUrl(reportType, normalisedQuery)

    setReportStatus(request, jobId, {
      status: 'pending',
      reportType
    })

    queryTrackingApi(url)
      .then((returnedFilename) => {
        if (!isValidJsonFilename(returnedFilename)) { throw new Error(`Filename: ${returnedFilename} is not a valid format.`) }
        return setReportStatus(request, jobId, {
          status: 'download',
          reportType,
          returnedFilename,
          reportFilename: generateFinalFilenameFunc(normalisedQuery)
        })
      })
      .catch((err) => {
        console.error(`Error generating report ${jobId}:`, err)
        return setReportStatus(request, jobId, {
          status: 'failed'
        })
      })

    return h.view('report-list/report-loading', {
      jobId,
      reportTitle,
      reportUrl
    })
  }
}

const isValidJsonFilename = (filename) => {
  return typeof filename === 'string' &&
         filename.trim().length > 0 &&
         filename.toLowerCase().endsWith('.json')
}

module.exports = {
  generateReportHandler
}
