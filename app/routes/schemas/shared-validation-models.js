const Joi = require('joi')

const frnGreaterThan = 999999999
const frnLessThan = 10000000000

const frnValidation = Joi.number()
  .integer()
  .greater(frnGreaterThan)
  .less(frnLessThan)
  .empty('')
  .optional()
  .error(errors => {
    errors.forEach(err => {
      err.message = 'The FRN, if present, must be 10 digits'
    })
    return errors
  })

module.exports = {
  frnValidation
}
