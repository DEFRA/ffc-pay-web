const Joi = require('joi')

// .unknown(true) allows us to pass in multiple schemes as they are onboarded without needing to modify this schema.
// we may want to consider cost vs benefit of locking this down.
const schema = Joi.object({
  emailAddress: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'Email address is required',
      'string.base': 'Email address must be a string',
      'string.email': 'Email address must be a valid email',
      'string.empty': 'Email address is required'
    }),
  contactId: Joi.number()
    .optional()
    .allow('')
    .messages({
      'number.base': 'An issue occurred linking this update to an existing record. Please inform the Payments & Documents Services team.'
    }),
  action: Joi.string()
    .required()
    .valid('edit', 'create')
    .messages({
      'any.required': 'Action is required',
      'string.base': 'Action must be a string',
      'string.empty': 'Action is required',
      'string.valid': 'Action must be edit or create',
      'any.only': 'Action must be edit or create'
    })
})
  .unknown(true)
  .custom((value, helpers) => {
    const fixedFields = new Set(['emailAddress', 'contactId', 'action', 'crumb', 'schemeId'])

    const selectedAlertTypes = Object.entries(value)
      .filter(([key]) => !fixedFields.has(key))
      .flatMap(([, alertTypes]) =>
        Array.isArray(alertTypes) ? alertTypes : [alertTypes]
      )
      .filter(Boolean)

    if (selectedAlertTypes.length === 0) {
      return helpers.message({
        custom: 'Select at least one alert type'
      })
    }

    return value
  })

module.exports = schema
