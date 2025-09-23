const { postProcessing } = require('../api')
const { applicationAdmin, closureAdmin } = require('../auth/permissions')
const { getClosures } = require('../closure')

const AUTH_SCOPE = { scope: [applicationAdmin, closureAdmin] }

module.exports = [{
  method: 'GET',
  path: '/closure',
  options: {
    auth: AUTH_SCOPE,
    handler: async (_request, h) => {
      const closures = await getClosures()
      return h.view('closure', { closures })
    }
  }
},
{
  method: 'POST',
  path: '/closure/remove',
  options: {
    auth: AUTH_SCOPE,
    handler: async (request, h) => {
      await postProcessing('/closure/remove', { closedId: request.payload.closedId })
      return h.redirect('/closure')
    }
  }
}]
