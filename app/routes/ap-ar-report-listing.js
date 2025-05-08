const { holdAdmin, schemeAdmin, dataView } = require('../auth/permissions')
const api = require('../api')
const convertToCSV = require('../helpers/convert-to-csv')
const apListingSchema = require('./schemas/ap-listing-schema')
const config = require('../config/storage')

const REPORT_TYPES = {
  REQUEST_EDITOR: 'request-editor-report',
  CLAIM_LEVEL: 'claim-level-report',
  AP_LISTING: 'ap-listing',
  AR_LISTING: 'ar-listing',
  AP_AR_LISTING: 'ap-ar-listing'
}

const AUTH_SCOPE = { scope: [holdAdmin, schemeAdmin, dataView] }
const DEFAULT_START_DATE = '2015-01-01'
const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404 }
const startsAt = 0
const removeFromEnd = -4

const getPoundValue = (value) => {
  return value ? (Number(value) / 100).toFixed(2) : '0.00'
}

const convertDateToDDMMYYYY = (date) => {
  if (!date) {
    return null
  }
  const dateObj = new Date(date)
  return isNaN(dateObj) ? null : dateObj.toLocaleDateString('en-GB')
}

const mapRequestEditorData = data => ({
  FRN: data.frn,
  deltaAmount: getPoundValue(data.deltaAmount),
  SourceSystem: data.sourceSystem,
  agreementNumber: data.agreementNumber,
  invoiceNumber: data.invoiceNumber,
  PaymentRequestNumber: data.paymentRequestNumber,
  year: data.year,
  receivedInRequestEditor: convertDateToDDMMYYYY(data.receivedInRequestEditor),
  enriched: data.enriched,
  debtType: data.debtType,
  ledgerSplit: data.ledgerSplit,
  releasedFromRequestEditor: convertDateToDDMMYYYY(data.releasedFromRequestEditor)
})

const mapClaimLevelData = data => ({
  FRN: data.frn,
  claimID: data.claimNumber,
  revenueOrCapital: data.revenueOrCapital,
  agreementNumber: data.agreementNumber,
  year: data.year,
  paymentCurrency: data.currency,
  latestFullClaimAmount: getPoundValue(data.value),
  latestSitiPR: data.paymentRequestNumber,
  latestInDAXAmount: getPoundValue(data.daxValue),
  latestInDAXPR: data.daxPaymentRequestNumber,
  overallStatus: data.overallStatus,
  crossBorderFlag: data.crossBorderFlag,
  latestTransactionStatus: data.status,
  valueStillToProcess: getPoundValue(data.valueStillToProcess),
  PRsStillToProcess: data.prStillToProcess
})

const mapBaseAPARData = data => ({
  Filename: data.daxFileName,
  'Date Time': convertDateToDDMMYYYY(data.lastUpdated),
  Event: data.status,
  FRN: data.frn,
  'Original Invoice Number': data.originalInvoiceNumber,
  'Original Invoice Value': getPoundValue(data.value),
  'Invoice Number': data.invoiceNumber,
  'Invoice Delta Amount': data.deltaAmount,
  'D365 Invoice Imported': data.routedToRequestEditor,
  'D365 Invoice Payment': getPoundValue(data.settledValue),
  'PH Error Status': data.phError,
  'D365 Error Status': data.daxError
})

const mapAPData = data => ({
  ...mapBaseAPARData(data)
})

const mapARData = data => {
  const mapped = { ...mapBaseAPARData(data) }
  delete mapped['D365 Invoice Payment']
  return mapped
}

const getDataMapper = reportName => {
  if (reportName === REPORT_TYPES.AR_LISTING) {
    return mapARData
  } else if (reportName === REPORT_TYPES.REQUEST_EDITOR) {
    return mapRequestEditorData
  } else if (reportName === REPORT_TYPES.CLAIM_LEVEL) {
    return mapClaimLevelData
  } else {
    return mapAPData
  }
}

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
        formatDate(
          query['start-date-day'],
          query['start-date-month'],
          query['start-date-year']
        ) || DEFAULT_START_DATE
      const endDate =
        formatDate(
          query['end-date-day'],
          query['end-date-month'],
          query['end-date-year']
        ) || getCurrentDate()

      try {
        const url = `${reportDataUrl}?startDate=${startDate}&endDate=${endDate}`
        const response = await api.getTrackingData(url)
        const mapper = getDataMapper(reportName)
        const selectedData = response.payload[reportDataKey].map(mapper)

        if (selectedData.length === 0) {
          return h.view(`reports-list/${reportName}`, {
            errors: [{ text: 'No data available for the selected date range' }]
          })
        }

        const csv = convertToCSV(selectedData)
        const filename = `${getBaseFilename(
          reportName
        )}-from-${startDate}-to-${endDate}.csv`

        return h
          .response(csv)
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename=${filename}`)
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
