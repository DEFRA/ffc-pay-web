const Joi = require('joi').extend(require('@joi/date'))
const minFRN = 1000000000
const maxFRN = 9999999999
const maxAgreementNumberLength = 50

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
  agreementNumber: Joi.string()
    .required()
    .max(maxAgreementNumberLength)
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid agreement number'
      })
      return errors
    }),
  closureDate: Joi.date()
    .format('YYYY-MM-DD')
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a valid date'
      })
      return errors
    })
})
