const Joi = require('joi').extend(require('@joi/date'))

module.exports = Joi.object({
  retentionDataId: Joi.number()
    .integer()
    .required(),

  frn: Joi.number()
    .required(),

  agreementNumber: Joi.string()
    .required(),

  schemeName: Joi.string()
    .required(),

  page: Joi.number()
    .integer()
    .min(1)
    .optional(),

  perPage: Joi.number()
    .integer()
    .min(1)
    .optional(),

  frnAgreement: Joi.string()
    .allow('')
    .optional(),

  schemeId: Joi.alternatives()
    .try(
      Joi.number().integer(),
      Joi.string().allow('')
    )
    .optional()
})
