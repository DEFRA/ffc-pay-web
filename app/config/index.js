const Joi = require('joi')
const authConfig = require('./auth')
const storageConfig = require('./storage')
const messageConfig = require('./message')
const cacheConfig = require('./cache')

const portNumber = 3007
const staticCacheTimeout = 604800000

// Define config schema
const schema = Joi.object({
  serviceName: Joi.string().default('Payment management'),
  port: Joi.number().default(portNumber),
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  staticCacheTimeoutMillis: Joi.number().default(staticCacheTimeout),
  googleTagManagerKey: Joi.string().default(''),
  paymentsEndpoint: Joi.string().uri().required(),
  trackingEndpoint: Joi.string().uri().required(),
  injectionEndpoint: Joi.string().uri().required(),
  alertingEndpoint: Joi.string().uri().required(),
  statementPublisherEndpoint: Joi.string().uri().required(),
  manualPaymentsActive: Joi.boolean().default(true),
  approvedEmailDomains: Joi.string().default('')
})

// Build config
const config = {
  serviceName: process.env.SERVICE_NAME,
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  staticCacheTimeoutMillis: process.env.STATIC_CACHE_TIMEOUT_IN_MILLIS,
  googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
  paymentsEndpoint: process.env.PAYMENTS_SERVICE_ENDPOINT,
  trackingEndpoint: process.env.TRACKING_SERVICE_ENDPOINT,
  injectionEndpoint: process.env.INJECTION_SERVICE_ENDPOINT,
  alertingEndpoint: process.env.ALERTING_SERVICE_ENDPOINT,
  statementPublisherEndpoint: process.env.STATEMENT_PUBLISHER_ENDPOINT,
  manualPaymentsActive: process.env.MANUAL_PAYMENTS_ACTIVE,
  approvedEmailDomains: process.env.APPROVED_EMAIL_DOMAINS
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value

value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'

value.useRedis = !(value.isTest || cacheConfig.host === undefined)

value.storageConfig = storageConfig
value.messageConfig = messageConfig
value.authConfig = authConfig

value.cache = cacheConfig

value.cache.catboxOptions = value.useRedis
  ? {
      ...cacheConfig.catboxOptions,
      tls: value.isDev ? undefined : {}
    }
  : {}
value.cache.catbox = value.useRedis ? require('@hapi/catbox-redis') : require('@hapi/catbox-memory')

if (value.useRedis) {
  console.info('Redis enabled. TTL:', value.cache.ttl)
} else {
  console.info('Using in-memory cache')
}

module.exports = value
