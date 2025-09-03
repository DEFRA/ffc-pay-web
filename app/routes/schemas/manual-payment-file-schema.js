const Joi = require('joi')

const filenameRegex = /^FFC_Manual_Batch_.*csv$/i

module.exports = Joi.object({
  file: Joi.object({
    filename: Joi.string().pattern(filenameRegex).required(),
    path: Joi.string().required(),
    headers: Joi.object({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid('text/csv').required()
    }).required(),
    bytes: Joi.number().required()
  }).error(errors => {
    errors.forEach(err => {
      const key = err.path && err.path[1]
      console.log('Error key:', key)
      if (key === 'filename') {
        err.message = 'Filename must match FFC_Manual_Batch_<scheme>_<timestamp> (e.g. FFC_Manual_Batch_SFI23_20250626091445)'
      } else if (key === 'headers') {
        err.message = 'File must be a CSV (content-type: text/csv)'
      } else {
        err.message = 'Provide a CSV file'
      }
    })

    return errors
  })
})
