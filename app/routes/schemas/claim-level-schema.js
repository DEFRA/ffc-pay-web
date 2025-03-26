const Joi = require('joi')
const { CS } = require('../../constants/schemes')
const { frnValidation } = require('./shared-validation-models')

const yearGreaterThan = 1993
const yearLessThan = 2099

module.exports = Joi.object({
  frn: frnValidation,

  year: Joi.number()
    .integer()
    .greater(yearGreaterThan)
    .less(yearLessThan)
    .when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.when('schemeId', {
        is: Joi.number().integer().valid(CS),
        then: Joi.optional().allow(''),
        otherwise: Joi.required().error(errors => {
          errors.forEach(err => {
            err.message = 'A valid year must be provided'
          })
          return errors
        })
      })
    }),

  revenueOrCapital: Joi.string()
    .allow('', 'Revenue', 'Capital')
    .when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.when('schemeId', {
        is: Joi.number().integer().valid(CS),
        then: Joi.required()
          .valid('Revenue', 'Capital')
          .error(errors => {
            errors.forEach(err => {
              err.message = 'Select Revenue or Capital'
            })
            return errors
          }),
        otherwise: Joi.valid('').error(errors => {
          errors.forEach(err => {
            err.message = 'Revenue/Capital should not be selected for this scheme'
          })
          return errors
        })
      })
    }),

  schemeId: Joi.number()
    .integer()
    .when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required().error(errors => {
        errors.forEach(err => {
          err.message = 'A scheme must be selected'
        })
        return errors
      })
    })
})
