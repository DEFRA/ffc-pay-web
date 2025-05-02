const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const api = require('../api')
const apListingSchema = require('./schemas/ap-listing-schema')
const config = require('../config/storage')
const { getDataRequestFile } = require('../storage')

const { format } = require('@fast-csv/format')
const { Transform } = require('stream')

const JSONStream = require('JSONStream')

const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }
const DEFAULT_START_DATE = '2015-01-01'
const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404 }
const startsAt = 0
const removeFromEnd = -4

const formatDate = (day, month, year) => {
  if (!day || !month || !year) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`
}

const getCurrentDate = () => {
  const now = new Date()
  return formatDate(now.getDate(), now.getMonth() + 1, now.getFullYear())
}

const getBaseFilename = reportName => {
  const fileNames = {
    [REPORT_TYPES.AR_LISTING]: config.arListingReportName,
    [REPORT_TYPES.REQUEST_EDITOR]: config.requestEditorReportName,
    [REPORT_TYPES.CLAIM_LEVEL]: config.claimLevelReportName,
    default: config.apListingReportName
  }
  return (fileNames[reportName] || fileNames.default).slice(
    startsAt,
    removeFromEnd
  )
}

const handleValidationError = async (request, h, err, reportName) => {
  request.log(['error', 'validation'], err)
  const errors =
    err.details?.map(detail => ({
      text: detail.message,
      href: '#' + detail.path[0]
    })) || []
  return h
    .view(`reports-list/${reportName}`, { errors })
    .code(HTTP_STATUS.BAD_REQUEST)
    .takeover()
}

const createGetRoute = reportName => ({
  method: 'GET',
  path: `/report-list/${reportName}`,
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => h.view(`reports-list/${reportName}`)
  }
})

const createDownloadRoute = (reportName, reportDataUrl, reportDataKey) => ({
  method: 'GET',
  path: `/report-list/${reportName}/download`,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      query: apListingSchema,
      failAction: async (request, h, err) =>
        handleValidationError(request, h, err, reportName)
    },
    handler: async (request, h) => {
      const { query } = request

      const startDate =
        formatDate(query['start-date-day'], query['start-date-month'], query['start-date-year']) ||
        DEFAULT_START_DATE
      const endDate =
        formatDate(query['end-date-day'], query['end-date-month'], query['end-date-year']) ||
        getCurrentDate()

      try {
        const url = `${reportDataUrl}?startDate=${startDate}&endDate=${endDate}`
        console.log(`Downloading report data from ${url}`)
        const response = await api.getTrackingData(url)

        console.log('Tracking response received', response.payload)

        const jsonFile = await getDataRequestFile(response.payload.file)
        if (!jsonFile) {
          console.log('No data available for the supplied category and value')
          return null
        }

        const mapper = getDataMapper(reportName)

        // Create transform stream to map JSON to CSV row
        const mapTransform = new Transform({
          objectMode: true,
          transform (chunk, _encoding, callback) {
            try {
              const mapped = mapper(chunk)
              callback(null, mapped)
            } catch (err) {
              callback(err)
            }
          }
        })

        const csvStream = format({ headers: true })

        // Stream the CSV file directly to the user.
        const responseStream = jsonFile.readableStreamBody
          .pipe(JSONStream.parse('*'))
          .pipe(mapTransform)
          .pipe(csvStream)

        const filename = `${getBaseFilename(reportName)}-from-${startDate}-to-${endDate}.csv`

        console.log(`Streaming CSV: ${filename}`)

        return h
          .response(responseStream)
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
      } catch (error) {
        console.error('Failed to fetch tracking data:', error)
        return h.view(`reports-list/${reportName}`, {
          errorMessage: 'Failed to fetch tracking data'
        })
      }
    }
  }
})

const generateRoutes = (reportName, reportDataUrl, reportDataKey) => [
  createGetRoute(reportName),
  createDownloadRoute(reportName, reportDataUrl, reportDataKey)
]

module.exports = generateRoutes
