const Joi = require('joi')
const blankMessage = 'Enter an invoice number'
const invalidMessage = 'Enter a valid invoice number'

module.exports = Joi.object({
  invoiceNumber: Joi.string()
    .trim()
    .pattern(/^S\d{7}V\d{3}$/)
    .required()
    .messages({
      'string.empty': blankMessage,
      'any.required': blankMessage,
      'string.pattern.base': invalidMessage
    })
})