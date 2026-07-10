const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999

module.exports = Joi.object({
  frn: Joi.number()
    .integer()
    .min(minFRN)
    .max(maxFRN)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'FRN (Firm Reference Number) must be 10 digits'
      })
      return errors
    }),
  selectScheme: Joi.string().optional(),
  holdCategoryId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Choose a hold category'
      })
      return errors
    })
})
