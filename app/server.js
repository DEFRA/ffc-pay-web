const hapi = require('@hapi/hapi')
const config = require('./config')

const createServer = async () => {
  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    cache: [{
      name: config.cache.cacheName,
      provider: {
        constructor: config.cache.catbox,
        options: config.cache.catboxOptions
      }
    }],
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  const cache = server.cache({ cache: config.cache.cacheName, segment: config.cache.segment, expiresIn: config.cache.ttl })
  server.app.cache = cache

  // Register the plugins
  await server.register(require('./plugins/auth'))
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/crumb'))
  await server.register(require('./plugins/logging'))
  await server.register(require('./plugins/view-context'))

  if (config.isDev) {
    await server.register(require('blipp'))
  }

  return server
}

module.exports = createServer
