const Joi = require('joi')

module.exports = Joi.object({
  file: Joi.object().keys({
    filename: Joi.string().required(),
    path: Joi.string().required(),
    headers: Joi.object().keys({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid('text/csv').required()
    }).required(),
    bytes: Joi.number().required()
  }).error(errors => {
    errors[0].message = 'Provide a CSV file'
    return errors[0]
  })
})
