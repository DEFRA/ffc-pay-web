const Joi = require('joi')
const minFRN = 1000000000
const maxFRN = 9999999999
const minYear = 2020
const maxYear = 2099
const limitStart = 1
const limitEnd = 1000

module.exports = Joi.object({
  filename: Joi.string()
    .optional()
    .allow('', null)
    .pattern(/^FFC_(PaymentDelinkedStatement|PaymentSfi23QuarterlyStatement)_[A-Z]+_\d{4}_\d{10}_\d{16}\.pdf$/i)
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Filename must match format either: FFC_PaymentDelinkedStatement_ or FFC_PaymentSfi23QuarterlyStatement_ Then: [Scheme]_[Year]_[FRN]_[Timestamp].pdf'
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
  timestamp: Joi.alternatives().try(
    // Format 1: DD-MM-YYYY (e.g., 25-12-2026)
    Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/),
    // Format 2: DD-MM-YYYY HH:MM (e.g., 25-12-2026 14:30)
    Joi.string().pattern(/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}\s([01]\d|2[0-3]):[0-5]\d$/),
    // Format 3: 16 digit timestamp (e.g., 2026122514300000)
    Joi.string().pattern(/^\d{16}$/)
  )
    .optional()
    .allow('', null)
    .error(errors => {
      errors.forEach(err => {
        err.message = 'Timestamp must be in the format DD-MM-YYYY, DD-MM-YYYY HH:MM or a 16 digit timestamp (e.g., 2026122514300000)'
      })
      return errors
    }),
  limit: Joi.number()
    .integer()
    .min(limitStart)
    .max(limitEnd)
    .optional(),
  continuationToken: Joi.string()
    .optional()
    .allow(null),
  pageNumber: Joi.number()
    .integer()
    .min(0)
    .optional()
    .allow(null)
}).custom((value, helpers) => {
  // Determine presence of numeric fields treating 0 as NOT provided
  const numberPresent = v => v !== undefined && v !== '' && v !== null && Number(v) !== 0

  const hasFilename = value.filename && String(value.filename).trim() !== ''
  const hasOtherCriteria = (
    numberPresent(value.schemeId) ||
    numberPresent(value.marketingYear) ||
    numberPresent(value.frn) ||
    (value.timestamp && String(value.timestamp).trim() !== '')
  )

  if (!hasFilename && !hasOtherCriteria) {
    return helpers.message('At least one search criterion must be provided')
  }

  if (hasFilename && hasOtherCriteria) {
    return helpers.message('Please search using either the full filename OR individual criteria, not both')
  }

  return value
})
