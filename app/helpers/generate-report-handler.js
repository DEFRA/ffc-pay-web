const { randomUUID } = require('node:crypto')
const setReportStatus = require('./set-report-status')
const { buildReportUrl } = require('./build-query-url')
const { queryTrackingApi } = require('./query-tracking-api')
const { normaliseQuery } = require('./normalise-query')
const NOT_FOUND = 404

const resolveReportOptions = (query, options) => {
  const reportTitle = options.reportTitle ?? query['report-title']
  return {
    reportUrl: options.reportUrl ?? query['report-url'],
    reportTitle,
    reportsUrl: options.reportsUrl ?? '/download-report-list',
    noResultsView: options.noResultsView ?? 'payment-report-unavailable',
    loadingView: options.loadingView ?? 'report-loading/report-loading',
    schemeName: options.schemeName ?? query['scheme-name'] ?? query.schemeName ?? query.scheme ?? reportTitle
  }
}

const handleQueryResult = (request, jobId, reportType, schemeName, generateFinalFilenameFunc, normalisedQuery) => (returnedFilename) => {
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
}

const handleQueryError = (request, jobId) => (err) => {
  if (err.output?.statusCode === NOT_FOUND) {
    return setReportStatus(request, jobId, { status: 'no-results' })
  }
  console.error(`Error generating report ${jobId}:`, err)
  return setReportStatus(request, jobId, { status: 'failed' })
}

const generateReportHandler = (reportTypeParam, generateFinalFilenameFunc, options = {}) => {
  return async (request, h) => {
    const { query } = request
    const { reportUrl, reportTitle, reportsUrl, noResultsView, loadingView, schemeName } = resolveReportOptions(query, options)

    if (query.noResults === 'true') {
      return h.view(noResultsView, { reportTitle, reportsUrl })
    }

    const jobId = randomUUID()
    // All other reports will have their report type passed as a param, except AP and AR Reports.
    const reportType = reportTypeParam ?? query['select-type']
    const normalisedQuery = normaliseQuery(query)
    const url = buildReportUrl(reportType, normalisedQuery)

    setReportStatus(request, jobId, { status: 'pending', reportType, schemeName })

    queryTrackingApi(url)
      .then(handleQueryResult(request, jobId, reportType, schemeName, generateFinalFilenameFunc, normalisedQuery))
      .catch(handleQueryError(request, jobId))

    return h.view(loadingView, { jobId, reportTitle, reportUrl, reportsUrl })
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
