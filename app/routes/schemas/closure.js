const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999
const maxAgreement = 50
const minDayMonth = 1
const maxDay = 31
const maxMonth = 12
const minYear = 2023
const maxYear = 2099

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
})
