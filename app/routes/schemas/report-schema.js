const Joi = require('joi')
const { CS, BPS } = require('../../constants/schemes')
const frnGreaterThan = 999999999
const frnLessThan = 10000000000
const yearGreaterThan = 1993
const yearLessThan = 2099

module.exports = Joi.object({
  frn: Joi.number()
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
    }),

  year: Joi.number()
    .integer()
    .greater(yearGreaterThan)
    .less(yearLessThan)
    .when('schemeId', {
      is: Joi.number().integer().valid(CS),
      then: Joi.optional().allow(''),
      otherwise: Joi.required().error(errors => {
        errors.forEach(err => {
          err.message = 'A valid year must be provided'
        })
        return errors
      })
    }),

  prn: Joi.number()
    .integer()
    .when('schemeId', {
      is: Joi.number().integer().valid(BPS),
      then: Joi.required().error(errors => {
        errors.forEach(err => {
          err.message = 'Provide a payment request number'
        })
        return errors
      }),
      otherwise: Joi.allow('').error(errors => {
        return errors
      })
    }),

  revenueOrCapital: Joi.string()
    .allow('', 'Revenue', 'Capital')
    .when('schemeId', {
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
    }),

  schemeId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = 'A scheme must be selected'
      })
      return errors
    })
})
