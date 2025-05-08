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

  // AP-AR Reports only
  if (startDate && endDate) {
    return `${baseUrl}?startDate=${startDate}&endDate=${endDate}`
  }

  // Fall back to generic url but swap out tracking endpoint
  let url = `${baseUrl}?schemeId=${schemeId}&year=${year}`
  if (prn) url += `&prn=${prn}`
  if (frn) url += `&frn=${frn}`
  if (revenueOrCapital && revenueOrCapital.trim() !== '') {
    url += `&revenueOrCapital=${revenueOrCapital}`
  }
  return url
}

module.exports = {
  buildReportUrl
}
