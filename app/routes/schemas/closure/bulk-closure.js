const Joi = require('joi')
const fileSchema = require('../file-schema')

module.exports = Joi.object({
  file: fileSchema
})
