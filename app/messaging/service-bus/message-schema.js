const Joi = require('joi')

module.exports = Joi.object({
  body: Joi.object().allow(null),
  type: Joi.string().required(),
  source: Joi.string().required()
})
