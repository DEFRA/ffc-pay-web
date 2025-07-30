const ERROR_VIEWS = require('../constants/error-views')
const {
  NOT_AUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR
} = require('../constants/http-status-codes')

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (!response.isBoom) {
          return h.continue
        }

        const statusCode = response.output.statusCode
        const message = response.message || 'An unexpected error occurred'

        if (statusCode === NOT_AUTHORIZED || statusCode === FORBIDDEN) {
          return h.view(ERROR_VIEWS.NOT_AUTHORIZED, { message }).code(statusCode)
        }

        if (statusCode === NOT_FOUND) {
          return h.view(ERROR_VIEWS.NOT_FOUND, { message }).code(statusCode)
        }

        if (statusCode === INTERNAL_SERVER_ERROR) {
          return h.view(ERROR_VIEWS.INTERNAL_SERVER_ERROR, { message }).code(statusCode)
        }

        request.log('error', {
          statusCode,
          data: response.data,
          message: response.message
        })

        return h.continue
      })
    }
  }
}
