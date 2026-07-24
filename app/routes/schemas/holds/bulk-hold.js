const Joi = require('joi')
const fileSchema = require('../file-schema')

module.exports = Joi.object({
  file: fileSchema,
  type: Joi.string().required().valid('add', 'remove').error(errors => {
    errors.forEach(err => {
      err.message = 'An error has occurred. Please return to the manage payment holds in bulk page.'
    })
    return errors
  }),
  selectScheme: Joi.string().required().error(errors => {
    errors.forEach(err => {
      err.message = 'Scheme is required'
    })
    return errors
  }),
  holdCategoryId: Joi.number().integer().required().error(errors => {
    errors.forEach(err => {
      err.message = 'Category is required'
    })
    return errors
  })
})
