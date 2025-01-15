const Joi = require('joi')
const frnGreaterThan = 999999999
const frnLessThan = 10000000000

module.exports = {
  frn: Joi.number()
    .integer()
    .greater(frnGreaterThan)
    .less(frnLessThan)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'The FRN must be 10 digits'
      })
      return errors
    })
}
