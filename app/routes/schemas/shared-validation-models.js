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

const prnError = errors => {
  errors.forEach(err => {
    err.message = 'Provide a payment request number'
  })
  return errors
}

const schemeError = errors => {
  errors.forEach(err => {
    err.message = 'A scheme must be selected'
  })
  return errors
}

const yearError = errors => {
  errors.forEach(err => {
    err.message = 'A valid year must be provided'
  })
  return errors
}

const revCapErrorRequired = errors => {
  errors.forEach(err => {
    err.message = 'Select Revenue or Capital'
  })
  return errors
}

const revCapErrorInvalid = errors => {
  errors.forEach(err => {
    err.message = 'Revenue/Capital should not be selected for this scheme'
  })
  return errors
}

const createPRNValidation = (dependsOnFrn = false) => {
  const prnValidation = Joi.number().integer()

  return dependsOnFrn
    ? prnValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional().allow('', null),
      otherwise: prnValidation.when('schemeId', {
        is: Joi.number().integer().valid(BPS),
        then: Joi.required().error(prnError),
        otherwise: Joi.allow('').error(e => e)
      })
    })
    : prnValidation.when('schemeId', {
      is: Joi.number().integer().valid(BPS),
      then: Joi.required().error(prnError),
      otherwise: Joi.allow('').error(e => e)
    })
}

const createYearValidation = (dependsOnFrn = false) => {
  const yearValidation = Joi.number().integer().greater(yearGreaterThan).less(yearLessThan)

  return dependsOnFrn
    ? yearValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional().allow('', null),
      otherwise: yearValidation.when('schemeId', {
        is: Joi.number().integer().valid(CS),
        then: Joi.optional().allow('', null),
        otherwise: Joi.required().error(yearError)
      })
    })
    : yearValidation.when('schemeId', {
      is: Joi.number().integer().valid(CS),
      then: Joi.optional().allow('', null),
      otherwise: Joi.required().error(yearError)
    })
}

const createSchemeIdValidation = (dependsOnFrn = false) => {
  const schemeIdValidation = Joi.number().integer()
  return dependsOnFrn
    ? schemeIdValidation.when('frn', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: schemeIdValidation.required().error(schemeError)
    })
    : schemeIdValidation.required().error(schemeError)
}

const createRevenueOrCapitalValidation = () => {
  const base = Joi.string().allow('', 'Revenue', 'Capital')

  return base.when('schemeId', {
    is: Joi.number().integer().valid(CS),
    then: base.required().valid('Revenue', 'Capital').error(revCapErrorRequired),
    otherwise: base.invalid('Revenue', 'Capital').error(revCapErrorInvalid)
  })
}

const createValidationSchema = (dependsOnFrn = false, includePrn = true) => {
  const schema = {
    'report-title': Joi.string().required(),
    'report-url': Joi.string().required(),
    frn: frnValidation,
    year: createYearValidation(dependsOnFrn),
    schemeId: createSchemeIdValidation(dependsOnFrn),
    revenueOrCapital: createRevenueOrCapitalValidation()
  }

  if (includePrn) {
    schema.prn = createPRNValidation(dependsOnFrn)
  }

  return Joi.object(schema)
}

module.exports = {
  createValidationSchema
}
