const Joi = require('joi')

const minDate = 1
const maxDateDay = 31
const maxDateMonth = 12
const minYear = 2015

const createDatePartSchema = (min, max) => {
  return Joi.number().integer().min(min).max(max).allow('').optional()
}

const validateStartDate = (startDay, startMonth, startYear, helpers) => {
  if (
    (startDay || startMonth || startYear) &&
    (!startDay || !startMonth || !startYear)
  ) {
    return helpers.message('Start date must include day, month, and year')
  }
  return null
}

const validateEndDate = (endDay, endMonth, endYear, helpers) => {
  if ((endDay || endMonth || endYear) && (!endDay || !endMonth || !endYear)) {
    return helpers.message('End date must include day, month, and year')
  }
  return null
}

const validateDateRange = (
  startDay,
  startMonth,
  startYear,
  endDay,
  endMonth,
  endYear,
  helpers
) => {
  if (startYear && endYear) {
    const startDate = new Date(startYear, startMonth - 1, startDay)
    const endDate = new Date(endYear, endMonth - 1, endDay)
    if (endDate < startDate) {
      return helpers.message('End date cannot be less than start date')
    }
  }
  return null
}

const validateCompleteDate = (value, helpers) => {
  const {
    'start-date-day': startDay,
    'start-date-month': startMonth,
    'start-date-year': startYear,
    'end-date-day': endDay,
    'end-date-month': endMonth,
    'end-date-year': endYear
  } = value

  const startDateError = validateStartDate(
    startDay,
    startMonth,
    startYear,
    helpers
  )
  if (startDateError) return startDateError

  const endDateError = validateEndDate(endDay, endMonth, endYear, helpers)
  if (endDateError) return endDateError

  const dateRangeError = validateDateRange(
    startDay,
    startMonth,
    startYear,
    endDay,
    endMonth,
    endYear,
    helpers
  )
  if (dateRangeError) return dateRangeError

  return value
}

const getSchema = () => {
  const yearNow = new Date().getFullYear()

  return Joi.object({
    'start-date-day': createDatePartSchema(minDate, maxDateDay),
    'start-date-month': createDatePartSchema(minDate, maxDateMonth),
    'start-date-year': createDatePartSchema(minYear, yearNow),
    'end-date-day': createDatePartSchema(minDate, maxDateDay),
    'end-date-month': createDatePartSchema(minDate, maxDateMonth),
    'end-date-year': createDatePartSchema(minYear, yearNow)
  }).custom(validateCompleteDate)
}

module.exports = getSchema()
