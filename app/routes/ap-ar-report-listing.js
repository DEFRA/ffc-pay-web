const { v4: uuidv4 } = require('uuid')
const { set } = require('../cache')
const { generateReport } = require('../reporting/get-ap-ar-report')
const { BAD_REQUEST } = require('../constants/http-status')

const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')

const apListingSchema = require('./schemas/ap-listing-schema')
const DEFAULT_START_DATE = '2015-01-01'
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const handleValidationError = async (request, h, err, reportName) => {
  request.log(['error', 'validation'], err)
  const errors =
    err.details?.map(detail => ({
      text: detail.message,
      href: '#' + detail.path[0]
    })) || []
  return h
    .view(`reports-list/${reportName}`, { errors })
    .code(BAD_REQUEST)
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

const createSubmitRoute = (reportName, reportDataUrl) => ({
  method: 'POST',
  path: `/report-list/${reportName}/submit`,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      payload: apListingSchema,
      failAction: async (request, h, err) =>
        handleValidationError(request, h, err, reportName)
    },
    handler: async (request, h) => {
      const jobId = uuidv4()

      const { payload } = request

      await set(request, jobId, { status: 'preparing', filename: undefined })
      console.log(`${jobId} preparing state set`)

      const {
        'start-date-day': startDay,
        'start-date-month': startMonth,
        'start-date-year': startYear,
        'end-date-day': endDay,
        'end-date-month': endMonth,
        'end-date-year': endYear
      } = payload

      // Then format
      const startDate =
        formatDate(startDay, startMonth, startYear) ||
        DEFAULT_START_DATE

      const endDate =
        formatDate(endDay, endMonth, endYear) ||
        getCurrentDate()

      generateReport(reportName, reportDataUrl, startDate, endDate)
        .then((filename) => set(request, jobId, { status: 'ready', filename: filename }))
        .catch(err => {
          console.error(`Error generating report ${jobId}:`, err)
          set(request, jobId, { status: 'failed', filename: undefined })
        })

      return h.view('reports-list/download-progress', {
        jobId,
        reportName
      })
    }
  }
})

const generateRoutes = (reportName, reportDataUrl, reportDataKey) => [
  createGetRoute(reportName),
  createSubmitRoute(reportName, reportDataUrl)
]

module.exports = generateRoutes
