const Joi = require('joi')

const filenameRegex = /^FFC_Manual_Batch_.*csv$/

module.exports = Joi.object({
  file: Joi.object().keys({
    filename: Joi.string().pattern(filenameRegex).required(),
    path: Joi.string().required(),
    headers: Joi.object().keys({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid('text/csv').required()
    }).required(),
    bytes: Joi.number().required()
  }).error(errors => {
    const err = errors[0]
    if (err && err.context && err.context.key === 'filename') {
      err.message = 'Filename must match FFC_Manual_Batch_SFI[_|##]_<timestamp> (e.g. FFC_Manual_Batch_SFI23_20250626091445)'
    } else {
      console.error('Manual payment file schema error:', err)
      err.message = 'Provide a CSV file'
    }
    return err
  })
})
