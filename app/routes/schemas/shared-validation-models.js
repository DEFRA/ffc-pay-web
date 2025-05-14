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

const createPRNValidation = (dependsOnFrn = false) => {
  const prnValidation = Joi.number().integer()

  if (dependsOnFrn) {
    return prnValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional().allow('', null),
      otherwise: prnValidation.when('schemeId', {
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
    })
  }

  return prnValidation.when('schemeId', {
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
}

const createYearValidation = (dependsOnFrn = false) => {
  const yearValidation = Joi.number()
    .integer()
    .greater(yearGreaterThan)
    .less(yearLessThan)
  if (dependsOnFrn) {
    return yearValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional().allow('', null),
      otherwise: yearValidation.when('schemeId', {
        is: Joi.number().integer().valid(CS),
        then: Joi.optional().allow('', null),
        otherwise: Joi.required().error(errors => {
          errors.forEach(err => {
            err.message = 'A valid year must be provided'
          })
          return errors
        })
      })
    })
  }

  return yearValidation.when('schemeId', {
    is: Joi.number().integer().valid(CS),
    then: Joi.optional().allow('', null),
    otherwise: Joi.required().error(errors => {
      errors.forEach(err => {
        err.message = 'A valid year must be provided'
      })
      return errors
    })
  })
}

const createSchemeIdValidation = (dependsOnFrn = false) => {
  const schemeIdValidation = Joi.number().integer()

  if (dependsOnFrn) {
    return schemeIdValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: schemeIdValidation.required().error(errors => {
        errors.forEach(err => {
          err.message = 'A scheme must be selected'
        })
        return errors
      })
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
  const base = Joi.string().allow('', 'Revenue', 'Capital')

  if (dependsOnFrn) {
    // No more frn‐based bypass: always apply the schemeId logic
    return base.when('schemeId', {
      is: Joi.number().integer().valid(CS),
      then: base
        .required()
        .valid('Revenue', 'Capital')
        .error(errs => {
          errs.forEach(e => { e.message = 'Select Revenue or Capital' })
          return errs
        }),
      otherwise: base
        .invalid('Revenue', 'Capital')
        .error(errs => {
          errs.forEach(e => {
            e.message = 'Revenue/Capital should not be selected for this scheme'
          })
          return errs
        })
    })
  }

  return base.when('schemeId', {
    is: Joi.number().integer().valid(CS),
    then: base
      .required()
      .valid('Revenue', 'Capital')
      .error(errs => {
        errs.forEach(e => { e.message = 'Select Revenue or Capital' })
        return errs
      }),
    otherwise: base
      .invalid('Revenue', 'Capital')
      .error(errs => {
        errs.forEach(e => {
          e.message = 'Revenue/Capital should not be selected for this scheme'
        })
        return errs
      })
  })
}

const createValidationSchema = (dependsOnFrn = false, includePrn = true) => {
  const schema = {
    'report-title': Joi.string().required(),
    'report-url': Joi.string().required(),

    frn: frnValidation,
    year: createYearValidation(dependsOnFrn),
    schemeId: createSchemeIdValidation(dependsOnFrn),
    revenueOrCapital: createRevenueOrCapitalValidation(dependsOnFrn)
  }

  if (includePrn) {
    schema.prn = createPRNValidation(dependsOnFrn)
  }

  return Joi.object(schema)
}

module.exports = {
  createValidationSchema
}
