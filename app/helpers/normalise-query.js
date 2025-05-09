const { formatDateFromParts } = require('./format-date')

const DEFAULT_START_DATE = '2015-01-01'

const getCurrentDate = () => {
  const now = new Date()
  return formatDateFromParts(now.getDate(), now.getMonth() + 1, now.getFullYear())
}

const getDateOrDefault = (day, month, year, defaultValue) =>
  formatDateFromParts(day, month, year) || defaultValue

const normaliseQuery = (query) => {
  const {
    'report-type': reportType,
    'start-date-day': startDay,
    'start-date-month': startMonth,
    'start-date-year': startYear,
    'end-date-day': endDay,
    'end-date-month': endMonth,
    'end-date-year': endYear,
    schemeId,
    year,
    prn,
    frn,
    revenueOrCapital
  } = query

  const isDateRange = startDay && startMonth && startYear && endDay && endMonth && endYear

  // Initialize startDate and endDate to null by default
  let startDate = null
  let endDate = null

  // AP-AR Reports only: Set startDate and endDate if it's a valid date range
  if (isDateRange) {
    startDate = getDateOrDefault(startDay, startMonth, startYear, DEFAULT_START_DATE)
    endDate = getDateOrDefault(endDay, endMonth, endYear, getCurrentDate())
  }

  return {
    reportType,
    schemeId,
    year,
    prn,
    revenueOrCapital,
    frn,
    startDate,
    endDate
  }
}

module.exports = { normaliseQuery }
