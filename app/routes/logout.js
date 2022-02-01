const azureAuth = require('../azure-auth')

module.exports = {
  method: 'GET',
  path: '/logout',
  handler: (request, h) => {
    azureAuth.logout(request.auth.credentials.account)
    request.cookieAuth.clear()
    return h.redirect('/login')
  }
}
