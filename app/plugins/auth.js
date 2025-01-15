const config = require('../config')
const authCookie = require('@hapi/cookie')
const auth = require('../auth')

const SESSION_AUTH = 'session-auth'

module.exports = {
  plugin: {
    name: 'auth',
    register: async server => {
      await server.register(authCookie)

      server.auth.strategy(SESSION_AUTH, 'cookie', {
        cookie: {
          name: SESSION_AUTH,
          password: config.authConfig.cookie.password,
          ttl: config.authConfig.cookie.ttl,
          path: '/',
          isSecure: config.isProd,
          isSameSite: 'Lax' // Needed for the post authentication redirect
        },
        keepAlive: true, // Resets the cookie ttl after each route
        redirectTo: '/login'
      })

      server.auth.default(SESSION_AUTH)

      server.ext('onPreAuth', async (request, h) => {
        if (request.auth.credentials) {
          await auth.refresh(
            request.auth.credentials.account,
            request.cookieAuth
          )
        }
        return h.continue
      })
    }
  }
}
