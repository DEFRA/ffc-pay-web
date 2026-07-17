const { randomUUID } = require('node:crypto')
const setReportStatus = require('./set-report-status')
const { buildReportUrl } = require('./build-query-url')
const { queryTrackingApi } = require('./query-tracking-api')
const { normaliseQuery } = require('./normalise-query')
const NOT_FOUND = 404

const generateReportHandler = (reportTypeParam, generateFinalFilenameFunc, options = {}) => {
  return async (request, h) => {
    const jobId = randomUUID()
    const { query } = request

    const reportUrl = options.reportUrl ?? query['report-url']
    const reportTitle = options.reportTitle ?? query['report-title']

    // All other reports will have their report type passed as a param, except AP and AR Reports.
    const reportType = reportTypeParam ?? query['select-type']
    const schemeName = options.schemeName ?? query['scheme-name'] ?? query.schemeName ?? query.scheme ?? reportTitle

    const normalisedQuery = normaliseQuery(query)

    const url = buildReportUrl(reportType, normalisedQuery)

    setReportStatus(request, jobId, {
      status: 'pending',
      reportType,
      schemeName
    })

    queryTrackingApi(url)
      .then((returnedFilename) => {
        if (returnedFilename == null || returnedFilename === '') {
          return setReportStatus(request, jobId, { status: 'no-results' })
        }
        if (!isValidJsonFilename(returnedFilename)) { throw new Error(`Filename: ${returnedFilename} is not a valid format.`) }
        return setReportStatus(request, jobId, {
          status: 'download',
          reportType,
          returnedFilename,
          reportFilename: generateFinalFilenameFunc(normalisedQuery),
          schemeName
        })
      })
      .catch((err) => {
        if (err.output?.statusCode === NOT_FOUND) {
          return setReportStatus(request, jobId, { status: 'no-results' })
        }
        console.error(`Error generating report ${jobId}:`, err)
        return setReportStatus(request, jobId, {
          status: 'failed'
        })
      })

    const reportsUrl = options.reportsUrl ?? '/generate-report-list'

    return h.view(options.loadingView ?? 'report-loading/report-loading', {
      jobId,
      reportTitle,
      reportUrl,
      reportsUrl
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
