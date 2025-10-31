const Joi = require('joi')

/*
  Filename rules:
  - Must start: FFC_Manual_Batch_
  - Optional scheme: one or more letters/digits followed by underscore (e.g. SFI_ or SFI23_)
  - Timestamp: either YYYYMMDDHHmm (12 digits) or YYYYMMDDHHmmss (14 digits)
    - Year limited to 2000-2099 and month/day/hour/minute/second validated to reasonable ranges
  - Must end with .csv (case-insensitive)
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

const manualPaymentFileSchema = Joi.object({
  file: Joi.object({
    filename: Joi.string().pattern(filenameRegex).required(),
    path: Joi.string().required(),
    headers: Joi.object({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid('text/csv').required()
    }).required(),
    bytes: Joi.number().required()
  }).required()
}).error(errors => {
  let csvError = null
  let filenameError = null

  errors.forEach(err => {
    const key = err.path?.[1] || err.path?.[0]

    if (key === 'headers') {
      csvError = err
      err.message = 'Invalid file type - We were unable to upload your manual payment file as the uploaded file is not a .CSV file. Only .CSV files are permitted.'
    } else if (key === 'filename') {
      filenameError = err
      err.message =
        'Invalid filename - We were unable to upload your manual payment file. Filenames must start with "FFC_Manual_Batch_". Optionally include a scheme (e.g. "SFI_" or "SFI23_"), then a timestamp in one of these formats: YYYYMMDDHHmm or YYYYMMDDHHmmss. The filename must end with ".csv". Examples: FFC_Manual_Batch_SFI23_202510231609.csv, FFC_Manual_Batch_202510231609.csv.'
    } else {
      err.message = 'Unknown error - We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.'
    }
  })

  if (csvError) {
    return [csvError] // Prioritise CSV error over filename error
  }

  return filenameError ? [filenameError] : errors
})

module.exports = manualPaymentFileSchema
