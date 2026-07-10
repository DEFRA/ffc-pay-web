const Joi = require('joi').extend(require('@joi/date'))

module.exports = Joi.object({
  retentionDataId: Joi.number().integer().required(),
  frn: Joi.number().required(),
  agreementNumber: Joi.string().required(),
  schemeName: Joi.string().required()
})
