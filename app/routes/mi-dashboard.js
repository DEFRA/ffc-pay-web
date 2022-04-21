const { schemeAdmin } = require('../auth/permissions')

module.exports = {
  method: 'GET',
  path: '/mi-dashboard',
  options: {
    auth: { scope: [schemeAdmin] },
    handler: async (_request, h) => {
      return h.view('mi-dashboard')
    }
  }
}
