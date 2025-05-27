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
  useV2Events: Joi.boolean().default(true),
  legacyReportsActive: Joi.boolean().default(true)
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
  useV2Events: process.env.USE_V2_EVENTS,
  legacyReportsActive: process.env.LEGACY_REPORTS_ACTIVE
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
