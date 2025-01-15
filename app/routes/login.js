const auth = require('../auth')
const HTTP_SERVER_ERROR = 500

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
    return h.view('500').code(HTTP_SERVER_ERROR)
  }
}
