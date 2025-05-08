const Joi = require('joi')

// Constants for min/max values
const minDate = 1
const maxDateDay = 31
const maxDateMonth = 12
const minYear = 2015

// Import report types
const { AP, AR } = require('../../constants/report-types')

// Allowed report types
const allowedReportTypes = [AP, AR]

// Helper function to create a date part schema (day, month, year)
const createDatePartSchema = (min, max) =>
  Joi.number().integer().min(min).max(max).allow('').optional()

// Validate start date: ensures that day, month, and year are all provided if any are given
const validateStartDate = (startDay, startMonth, startYear, helpers) => {
  if (
    (startDay || startMonth || startYear) &&
    (!startDay || !startMonth || !startYear)
  ) {
    return helpers.message('Start date must include day, month, and year')
  }
  return null // if everything is fine, return null
}

// Validate end date: ensures that day, month, and year are all provided if any are given
const validateEndDate = (endDay, endMonth, endYear, helpers) => {
  if (
    (endDay || endMonth || endYear) &&
    (!endDay || !endMonth || !endYear)
  ) {
    return helpers.message('End date must include day, month, and year')
  }
  return null
}

// Validate that the end date is after the start date
const validateDateRange = (startDay, startMonth, startYear, endDay, endMonth, endYear, helpers) => {
  if (startYear && endYear) {
    const startDate = new Date(startYear, startMonth - 1, startDay)
    const endDate = new Date(endYear, endMonth - 1, endDay)
    if (endDate < startDate) {
      return helpers.message('End date cannot be less than start date')
    }
  }
  return null
}

// Consolidated validation function for the complete date range (start and end date validation)
const validateCompleteDate = (value, helpers) => {
  const {
    'start-date-day': startDay,
    'start-date-month': startMonth,
    'start-date-year': startYear,
    'end-date-day': endDay,
    'end-date-month': endMonth,
    'end-date-year': endYear
  } = value

  return (
    validateStartDate(startDay, startMonth, startYear, helpers) ||
    validateEndDate(endDay, endMonth, endYear, helpers) ||
    validateDateRange(startDay, startMonth, startYear, endDay, endMonth, endYear, helpers) ||
    value
  )
}

// Schema definition
const getSchema = () => {
  const yearNow = new Date().getFullYear()

  return Joi.object({
    // Validate report type (AP and AR listing reports)
    'report-title': Joi.string().required(),
    'report-url': Joi.string().required(),
    'report-type': Joi.string().valid(...allowedReportTypes),

    // Date parts validation (day, month, year)
    'start-date-day': createDatePartSchema(minDate, maxDateDay),
    'start-date-month': createDatePartSchema(minDate, maxDateMonth),
    'start-date-year': createDatePartSchema(minYear, yearNow),
    'end-date-day': createDatePartSchema(minDate, maxDateDay),
    'end-date-month': createDatePartSchema(minDate, maxDateMonth),
    'end-date-year': createDatePartSchema(minYear, yearNow)
  }).custom(validateCompleteDate) // Apply the custom date validation logic
}

module.exports = getSchema()
