const Joi = require('joi')

const MAX_DAY = 31
const MAX_MONTH = 12
const MAX_YEAR = 9999

const createNumberSchema = (label, min, max) =>
  Joi.number()
    .integer()
    .min(min)
    .max(max)
    .required()
    .label(label)
    .messages({
      'any.required': `${label} is required`,
      'number.base': `${label} must be a number`,
      'number.integer': `${label} must be a whole number`,
      'number.min': `${label} is out of range`,
      'number.max': `${label} is out of range`
    })

const validateDate = (value, helpers) => {
  const { day, month, year } = value

  // Let the individual field rules report invalid or missing values.
  if (![day, month, year].every(Number.isInteger)) {
    return value
  }

  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return helpers.message('Enter a valid date')
  }

  return value
}

module.exports = Joi.object({
  schemeId: Joi.number()
    .integer()
    .required()
    .label('Scheme')
    .messages({
      'any.required': 'Select a scheme',
      'number.base': 'Select a valid scheme'
    }),
  day: createNumberSchema('Day', 1, MAX_DAY),
  month: createNumberSchema('Month', 1, MAX_MONTH),
  year: createNumberSchema('Year', 1, MAX_YEAR)
}).custom(validateDate)
