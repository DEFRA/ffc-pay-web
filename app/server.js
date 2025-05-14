const Hapi = require('@hapi/hapi')
const config = require('./config')

const createServer = async () => {
  const serverOptions = {
    port: config.port,
    routes: {
      validate: { options: { abortEarly: false } }
    },
    router: { stripTrailingSlash: true }
  }

  if (config.cache && typeof config.cache.catbox === 'function') {
    serverOptions.cache = [{
      name: config.cache.cacheName,
      provider: {
        constructor: config.cache.catbox,
        options: config.cache.catboxOptions
      }
    }]
  }

  const server = Hapi.server(serverOptions)

  if (serverOptions.cache) {
    server.app.cache = server.cache({
      cache: config.cache.cacheName,
      segment: config.cache.segment,
      expiresIn: config.cache.ttl
    })
  }

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
