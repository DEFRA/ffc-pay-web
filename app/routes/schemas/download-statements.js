const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999
const minYear = 2020
const maxYear = 2099

module.exports = Joi.object({
  filename: Joi.string()
    .optional()
    .allow('', null)
    .pattern(/^FFC_PaymentDelinkedStatement_[A-Z]+_\d{4}_\d{10}_\d{16}\.pdf$/i)
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Filename must match format: FFC_PaymentDelinkedStatement_[Scheme]_[Year]_[FRN]_[Timestamp].pdf'
      })
      return errors
    }),
  schemeId: Joi.number()
    .integer()
    .optional()
    .allow('', null),
  marketingYear: Joi.number()
    .integer()
    .min(minYear)
    .max(maxYear)
    .optional()
    .allow('', null),
  frn: Joi.number()
    .integer()
    .min(minFRN)
    .max(maxFRN)
    .optional()
    .allow('', null),
  timestamp: Joi.string()
    .pattern(/^\d{16}$/)
    .optional()
    .allow('', null)
}).custom((value, helpers) => {
  // At least one search criterion must be provided
  const hasValue = value.filename || value.schemeId || value.marketingYear || value.frn || value.timestamp
  if (!hasValue) {
    return helpers.error('any.custom', {
      message: 'At least one search criterion must be provided'
    })
  }
  return value
})
