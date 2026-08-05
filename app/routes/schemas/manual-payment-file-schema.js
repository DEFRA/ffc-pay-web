const Joi = require('joi')

/*
  Filename rules:
  - Must start: FFC_Manual_Batch_
  - Optional scheme: one or more letters/digits followed by underscore, for example SFI_ or SFI23_
  - Timestamp: either YYYYMMDDHHmm, 12 digits, or YYYYMMDDHHmmss, 14 digits
  - Must end with .csv, case-insensitive
*/
const prefix = 'FFC_Manual_Batch_'
const schemePart = '(?:[A-Z0-9]+_)?'
const year = String.raw`20\d{2}`
const month = String.raw`(?:0[1-9]|1[0-2])`
const day = String.raw`(?:0[1-9]|[12]\d|3[01])`
const hour = String.raw`(?:[01]\d|2[0-3])`
const minute = String.raw`[0-5]\d`
const second = String.raw`[0-5]\d`

const timestamp12 = String.raw`${year}${month}${day}${hour}${minute}`
const timestamp14 = String.raw`${year}${month}${day}${hour}${minute}${second}`
const timestamp = String.raw`(?:${timestamp14}|${timestamp12})`

const filenameRegex = new RegExp(String.raw`^${prefix}${schemePart}${timestamp}\.csv$`, 'i')

const csvContentTypes = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/octet-stream'
]

const manualPaymentFileSchema = Joi.object({
  file: Joi.object({
    filename: Joi.string().pattern(filenameRegex).required(),
    path: Joi.string().required(),
    headers: Joi.object({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid(...csvContentTypes).required()
    }).unknown(true).required(),
    bytes: Joi.number().required()
  }).unknown(true).required(),
  crumb: Joi.string().optional()
}).unknown(true).error(errors => {
  let csvError = null
  let filenameError = null

  errors.forEach(err => {
    const path = err.path || []
    const key = path[path.length - 1]

    if (key === 'content-type') {
      csvError = err
      err.message = 'The selected file must be a CSV'
    } else if (key === 'filename') {
      filenameError = err
      err.message = 'Filename must be in valid format'
    } else {
      err.message = 'Unknown error - We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.'
    }
  })

  if (csvError) {
    return [csvError]
  }

  return filenameError ? [filenameError] : errors
})

module.exports = manualPaymentFileSchema
