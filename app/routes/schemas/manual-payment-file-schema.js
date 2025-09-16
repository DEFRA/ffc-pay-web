const Joi = require('joi')

const filenameRegex = /^FFC_Manual_Batch_.*\.csv$/i

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
        'Invalid filename - We were unable to upload your manual payment file. Your filename does not follow the required naming convention. Filename must match the agreed format, e.g. FFC_Manual_Batch_SFI23_20250626091445.csv'
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
