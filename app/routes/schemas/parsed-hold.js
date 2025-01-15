const Joi = require('joi').extend(require('@joi/date'))
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
        err.message = 'A provided FRN is not in the required format'
      })
      return errors
    })
})
