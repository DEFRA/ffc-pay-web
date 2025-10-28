const Joi = require('joi')

module.exports = Joi.object({
  contactId: Joi.number().integer().required().messages({
    'number.base': 'A user must be specified to remove',
    'any.required': 'A user must be specified to remove'
  }),
  action: Joi.string()
    .required()
    .valid('remove')
    .messages({
      'any.required': 'Action is required',
      'string.base': 'Action must be a string',
      'string.empty': 'Action is required',
      'string.valid': 'Action must be remove'
    })
}).unknown(true)
