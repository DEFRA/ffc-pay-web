const { mapAuth, getUser } = require('../auth')
const HTTP_NOT_FOUND = 404
const HTTP_INTERNAL_SERVER_ERROR = 500

module.exports = {
  plugin: {
    name: 'view-context',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode
        if (
          request.response.variety === 'view' &&
          statusCode !== HTTP_NOT_FOUND &&
          statusCode !== HTTP_INTERNAL_SERVER_ERROR &&
          request.response.source.context
        ) {
          request.response.source.context.auth = mapAuth(request)
          request.response.source.context.user = getUser(request)
        }
        return h.continue
      })
    }
  }
}
