const Joi = require('joi')

const filenameRegex = /^FFC_Manual_Batch_.*\.csv$/i

const manualPayamentFileSchema = Joi.object({
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
  errors.forEach(err => {
    const key = err.path?.[1] || err.path?.[0]

    if (key === 'filename') {
      err.message =
        'Filename must match FFC_Manual_Batch_<scheme>_<timestamp>.csv (e.g. FFC_Manual_Batch_SFI23_20250626091445.csv)'
    } else if (key === 'headers') {
      err.message = 'File must be a CSV (content-type: text/csv)'
    } else {
      err.message = 'Unknown validation error'
    }
  })
  return errors
})

module.exports = manualPayamentFileSchema
