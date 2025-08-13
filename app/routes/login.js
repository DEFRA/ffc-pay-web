const auth = require('../auth')
const HTTP_STATUS = require('../constants/http-status-codes')
const ERROR_VIEWS = require('../constants/error-views')

module.exports = {
  method: 'GET',
  path: '/login',
  options: {
    auth: false
  },
  handler: async (_request, h) => {
    try {
      const authUrl = await auth.getAuthenticationUrl()
      return h.redirect(authUrl)
    } catch (err) {
      console.log('Error authenticating', err)
    }
    return h.view(ERROR_VIEWS.INTERNAL_SERVER_ERROR).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
