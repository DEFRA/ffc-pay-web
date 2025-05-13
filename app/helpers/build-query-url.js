const REPORT_HANDLERS = require('../constants/report-handlers')

const buildReportUrl = (reportType, payload) => {
  const {
    schemeId,
    year,
    prn,
    revenueOrCapital,
    frn,
    startDate,
    endDate
  } = payload

  const baseUrl = REPORT_HANDLERS[reportType]

  // AP-AR Reports: only use startDate and endDate
  if (startDate && endDate) {
    return `${baseUrl}?startDate=${startDate}&endDate=${endDate}`
  }

  const params = new URLSearchParams()

  if (schemeId) params.append('schemeId', schemeId)
  if (year) params.append('year', year)
  if (prn) params.append('prn', prn)
  if (frn) params.append('frn', frn)
  if (revenueOrCapital && revenueOrCapital.trim()) {
    params.append('revenueOrCapital', revenueOrCapital.trim())
  }

  return `${baseUrl}?${params.toString()}`
}

module.exports = {
  buildReportUrl
}
