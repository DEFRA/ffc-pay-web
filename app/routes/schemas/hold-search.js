const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999

module.exports = Joi.object({
  searchTerm: Joi.number()
    .integer()
    .min(minFRN)
    .max(maxFRN)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Enter a 10-digit FRN'
      })
      return errors
    })
})
