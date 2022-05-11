const joi = require('joi')
const mqConfig = require('./mq-config')
const authConfig = require('./auth')
const storageConfig = require('./storage')

// Define config schema
const schema = joi.object({
  serviceName: joi.string().default('Payment management'),
  port: joi.number().default(3007),
  env: joi.string().valid('development', 'test', 'production').default('development'),
  staticCacheTimeoutMillis: joi.number().default(7 * 24 * 60 * 60 * 1000),
  googleTagManagerKey: joi.string().default(''),
  paymentsEndpoint: joi.string().uri().required()
})

// Build config
const config = {
  serviceName: process.env.SERVICE_NAME,
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  staticCacheTimeoutMillis: process.env.STATIC_CACHE_TIMEOUT_IN_MILLIS,
  googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
  paymentsEndpoint: process.env.PAYMENTS_SERVICE_ENDPOINT
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the joi validated value
const value = result.value
value.authConfig = authConfig
value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'

value.serviceBus = mqConfig.serviceBus
value.enrichmentTopic = mqConfig.enrichmentTopic
value.enrichmentSubscription = mqConfig.enrichmentSubscription
value.processingTopic = mqConfig.processingTopic
value.processingSubscription = mqConfig.processingSubscription
value.submissionTopic = mqConfig.submissionTopic
value.submissionSubscription = mqConfig.submissionSubscription
value.acknowledgeTopic = mqConfig.acknowledgeTopic
value.acknowledgeSubscription = mqConfig.acknowledgeSubscription
value.returnTopic = mqConfig.returnTopic
value.returnSubscription = mqConfig.returnSubscription

// Don't try to connect to Redis for testing or if Redis not available
// value.useRedis = !value.isTest && value.cacheConfig.redisCatboxOptions.host !== undefined

if (!value.useRedis) {
  console.info('Redis disabled, using in memory cache')
}

value.catboxOptions = {
  host: value.redisHost,
  port: value.redisPort,
  password: value.redisPassword,
  tls: value.isProd ? {} : undefined,
  partition: value.redisPartition
}

value.storageConfig = storageConfig

module.exports = value
