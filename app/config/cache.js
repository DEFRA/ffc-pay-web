const Joi = require('joi')

const TTL = 10 * 60 * 1000 // 10 mins

const schema = Joi.object({
  host: Joi.string(),
  port: Joi.number().integer().default(6381),
  password: Joi.string().allow(''),
  partition: Joi.string().default('ffc-pay-web'),
  cacheName: Joi.string().default('reportPreparation'),
  segment: Joi.string().default('reportStatus'),
  ttl: Joi.number().integer().default(TTL)
})

const config = {
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  partition: process.env.REDIS_PARTITION,
  cacheName: process.env.REDIS_CACHE_NAME,
  segment: process.env.REDIS_STATEMENT_SEGMENT,
  ttl: process.env.REDIS_TTL
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The cache config is invalid. ${result.error.message}`)
}

const value = result.value

value.catboxOptions = {
  host: value.host,
  port: value.port,
  password: value.password,
  partition: value.partition
}

module.exports = value
