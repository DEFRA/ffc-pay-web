const Joi = require('joi')

const fileSchema = Joi.object({
  filename: Joi.string().required(),
  path: Joi.string().required(),
  headers: Joi.object({
    'content-disposition': Joi.string().required(),
    'content-type': Joi.string().valid('text/csv').required()
  }).required(),
  bytes: Joi.number().required()
}).error(errors => {
  errors[0].message = 'Provide a CSV file'
  return errors[0]
})

module.exports = fileSchema
