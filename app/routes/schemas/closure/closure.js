const Joi = require('joi')
const { isValidDatePart, isValidDate, minDayMonth, maxDay, maxMonth, minYear, maxYear } = require('../../../helpers/date-error-helpers')

const minFRN = 1000000000
const maxFRN = 9999999999
const maxAgreement = 50

module.exports = Joi.object({
  frn: Joi.number()
    .integer()
    .min(minFRN)
    .max(maxFRN)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a 10-digit FRN'
      })
      return errors
    }),
  agreement: Joi.string()
    .required()
    .max(maxAgreement)
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid agreement number'
      })
      return errors
    }),
  schemeId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Select a scheme'
      })
      return errors
    }),
  day: Joi.number()
    .integer()
    .min(minDayMonth)
    .max(maxDay)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid day'
      })
      return errors
    }),
  month: Joi.number()
    .integer()
    .min(minDayMonth)
    .max(maxMonth)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid month'
      })
      return errors
    }),
  year: Joi.number()
    .integer()
    .min(minYear)
    .max(maxYear)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid year'
      })
      return errors
    })
}).custom((value, helpers) => {
  const { day, month, year } = value

  const dayIsValid = isValidDatePart(day, minDayMonth, maxDay)
  const monthIsValid = isValidDatePart(month, minDayMonth, maxMonth)
  const yearIsValid = isValidDatePart(year, minYear, maxYear)

  if (!dayIsValid || !monthIsValid || !yearIsValid) {
    return value
  }

  if (!isValidDate(day, month, year)) {
    return helpers.error('date.invalid')
  }

  return value
}).messages({
  'date.invalid': 'Enter a valid date'
})
