const { v4: uuidv4 } = require('uuid')
const { set } = require('../../cache')
const { getReportData } = require('../../reporting/get-ap-ar-report')
const { BAD_REQUEST } = require('../../constants/http-status')
const REPORT_TYPES = require('../../constants/report-types')
const REPORT_DATA_URL = require('../../constants/data-url-by-report-type')

const { holdAdmin, schemeAdmin, dataView } = require('../../auth/permissions')

const apListingSchema = require('../schemas/ap-ar-report-schema')
const DEFAULT_START_DATE = '2015-01-01'
const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }

const handleValidationError = async (request, h, err) => {
  request.log(['error', 'validation'], err)
  const errors =
    err.details?.map(detail => ({
      text: detail.message,
      href: '#' + detail.path[0]
    })) || []
  return h
    .view('report-list/ap-ar-report', { errors })
    .code(BAD_REQUEST)
    .takeover()
}

const createGetRoute = () => ({
  method: 'GET',
  path: '/report-list/ap-ar-report',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => h.view('report-list/ap-ar-report')
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

const getDateOrDefault = (day, month, year, defaultValue) => formatDate(day, month, year) || defaultValue
const createSubmitRoute = () => ({
  method: 'POST',
  path: '/report-list/ap-ar-report/submit',
  options: {
    auth: AUTH_SCOPE,
    validate: {
      payload: apListingSchema,
      failAction: async (request, h, err) =>
        handleValidationError(request, h, err)
    },
    handler: async (request, h) => {
      const jobId = uuidv4()

      const { payload } = request

      console.log(payload)

      await set(request, jobId, { status: 'preparing', filename: undefined })
      console.log(`${jobId} preparing state set`)

      const {
        'report-title': reportTitle,
        'report-url': reportUrl,
        'report-type': reportType,
        'start-date-day': startDay,
        'start-date-month': startMonth,
        'start-date-year': startYear,
        'end-date-day': endDay,
        'end-date-month': endMonth,
        'end-date-year': endYear
      } = payload

      // Assign default value for reportType if it's not already defined in the payload
      const resolvedReportType = REPORT_TYPES[reportType] || reportType

      const startDate = getDateOrDefault(startDay, startMonth, startYear, DEFAULT_START_DATE)
      const endDate = getDateOrDefault(endDay, endMonth, endYear, getCurrentDate())

      const url = `${REPORT_DATA_URL[resolvedReportType]}?startDate=${startDate}&endDate=${endDate}`

      getReportData(url)
        .then((filename) => set(request, jobId, { status: 'ready', filename }))
        .catch(err => {
          console.error(`Error generating report ${jobId}:`, err)
          set(request, jobId, { status: 'failed', filename: undefined })
        })

      return h.view('report-list/download-progress', {
        jobId,
        reportTitle,
        reportUrl
      })
    }
  }
})

module.exports = [
  createGetRoute(),
  createSubmitRoute()
]
