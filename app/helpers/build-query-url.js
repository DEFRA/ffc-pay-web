const REPORT_HANDLERS = require('../constants/report-handlers')

const buildReportUrl = (reportType, payload) => {
  const baseUrl = REPORT_HANDLERS[reportType]
  if (!baseUrl) {
    throw new Error(`Unknown report type: ${reportType}`)
  }

  const { startDate, endDate } = payload

  // For AP/AR reports: only use startDate and endDate
  if (startDate && endDate) {
    return `${baseUrl}?startDate=${startDate}&endDate=${endDate}`
  }

  const params = new URLSearchParams(
    buildQueryParams(payload)
  )

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

const buildQueryParams = ({ schemeId, year, prn, frn, revenueOrCapital }) => ({
  ...(schemeId && { schemeId }),
  ...(year && { year }),
  ...(prn && { prn }),
  ...(frn && { frn }),
  ...(revenueOrCapital?.trim() && { revenueOrCapital: revenueOrCapital.trim() })
})

module.exports = {
  buildReportUrl
}
