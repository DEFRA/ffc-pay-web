const HTTP_NOT_AUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404
const HTTP_SERVER_ERROR = 500

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.isBoom) {
          const statusCode = response.output.statusCode

          if (
            statusCode === HTTP_NOT_AUTHORIZED ||
            statusCode === HTTP_FORBIDDEN
          ) {
            return h.view('unauthorized').code(statusCode)
          }

          if (statusCode === HTTP_NOT_FOUND) {
            return h.view('404').code(statusCode)
          }

          request.log('error', {
            statusCode,
            data: response.data,
            message: response.message
          })

          if (statusCode >= HTTP_SERVER_ERROR) {
            return h.view('500').code(statusCode)
          }

          return h.continue
        }
        return h.continue
      })
    }
  }
}
