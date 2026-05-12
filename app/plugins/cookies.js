const config = require('../config').cookieOptions
const { NOT_FOUND, INTERNAL_SERVER_ERROR } = require('../constants/http-status-codes')
const { getCurrentPolicy } = require('../cookies')

module.exports = {
  plugin: {
    name: 'cookies',
    register: (server, _options) => {
      server.state('cookies_policy', config)

      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode
        if (request.response.variety === 'view' && statusCode !== NOT_FOUND && statusCode !== INTERNAL_SERVER_ERROR && request.response.source.manager._context) {
          const cookiesPolicy = getCurrentPolicy(request, h)
          request.response.source.manager._context.cookiesPolicy = cookiesPolicy
        }
        return h.continue
      })
    }
  }
}
