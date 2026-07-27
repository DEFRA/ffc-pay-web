const Joi = require('joi')
const blankMessage = 'Enter an invoice number'

module.exports = Joi.object({
  invoiceNumber: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': blankMessage,
      'any.required': blankMessage
    })
})
