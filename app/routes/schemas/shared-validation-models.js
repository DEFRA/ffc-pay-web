const Joi = require('joi')
const { BPS, CS } = require('../../constants/schemes')

const frnGreaterThan = 999999999
const frnLessThan = 10000000000
const yearGreaterThan = 1993
const yearLessThan = 2099

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

const prnValidation = Joi.number()
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
  })

const createYearValidation = (dependsOnFrn = false) => {
  let yearValidation = Joi.number()
    .integer()
    .greater(yearGreaterThan)
    .less(yearLessThan)

  if (dependsOnFrn) {
    yearValidation = yearValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional().allow(''),
      otherwise: yearValidation
    })
  }

  return yearValidation.when('schemeId', {
    is: Joi.number().integer().valid(CS),
    then: Joi.optional().allow(''),
    otherwise: Joi.required().error(errors => {
      errors.forEach(err => {
        err.message = 'A valid year must be provided'
      })
      return errors
    })
  })
}

const createSchemeIdValidation = (dependsOnFrn = false) => {
  let schemeIdValidation = Joi.number().integer()

  if (dependsOnFrn) {
    schemeIdValidation = schemeIdValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: schemeIdValidation
    })
  }

  return schemeIdValidation.required().error(errors => {
    errors.forEach(err => {
      err.message = 'A scheme must be selected'
    })
    return errors
  })
}

const createRevenueOrCapitalValidation = (dependsOnFrn = false) => {
  let revenueOrCapitalValidation = Joi.string().allow('', 'Revenue', 'Capital')

  if (dependsOnFrn) {
    revenueOrCapitalValidation = revenueOrCapitalValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: revenueOrCapitalValidation
    })
  }

  return revenueOrCapitalValidation.when('schemeId', {
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
}

const createValidationSchema = (dependsOnFrn = false, includePrn = true) => {
  const schema = {
    frn: frnValidation,
    year: createYearValidation(dependsOnFrn),
    prn: prnValidation,
    schemeId: createSchemeIdValidation(dependsOnFrn),
    revenueOrCapital: createRevenueOrCapitalValidation(dependsOnFrn)
  }

  if (includePrn) {
    schema.prn = prnValidation
  }

  return Joi.object(schema)
}

module.exports = {
  createValidationSchema
}
