const joi = require('joi')
const authConfig = require('./auth')
const storageConfig = require('./storage')
const messageConfig = require('./message')
const portNumber = 3007
const staticCacheTimeout = 604800000

// Define config schema
const schema = joi.object({
  serviceName: joi.string().default('Payment management'),
  port: joi.number().default(portNumber),
  env: joi
    .string()
    .valid('development', 'test', 'production')
    .default('development'),
  staticCacheTimeoutMillis: joi.number().default(staticCacheTimeout),
  googleTagManagerKey: joi.string().default(''),
  paymentsEndpoint: joi.string().uri().required(),
  trackingEndpoint: joi.string().uri().required(),
  useV2Events: joi.boolean().default(true),
  legacyReportsActive: joi.boolean().default(true)
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

// Use the joi validated value
const value = result.value
value.authConfig = authConfig
value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'

value.storageConfig = storageConfig
value.messageConfig = messageConfig

module.exports = value
