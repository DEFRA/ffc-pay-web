const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999
const option1 = 100
const option2 = 100
const option3 = 100

const perPageOptions = [option1, option2, option3]

module.exports = Joi.object({
  frn: Joi.number()
    .integer()
    .min(minFRN)
    .max(maxFRN)
    .empty('')
    .error(errors => {
      errors.forEach(err => {
        err.message = 'FRN (Firm Reference Number) must be 10 digits'
      })
      return errors
    })
    .optional(),
  name: Joi.string()
    .empty('')
    .optional(),
  perPage: Joi.number()
    .integer()
    .valid(...perPageOptions)
    .empty('')
    .default(perPageOptions[0])
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .empty('')
    .default(1)
    .optional()
})
