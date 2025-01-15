const auth = require('../auth')
const HTTP_SERVER_ERROR = 500

module.exports = {
  method: 'GET',
  path: '/dev-auth',
  options: {
    auth: false
  },
  handler: async (request, h) => {
    try {
      await auth.authenticate(undefined, request.cookieAuth)
      return h.redirect('/')
    } catch (err) {
      console.error('Error authenticating', err)
    }
    return h.view('500').code(HTTP_SERVER_ERROR)
  }
}
