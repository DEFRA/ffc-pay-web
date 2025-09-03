const { postProcessing } = require('../api')
const { closureAdmin } = require('../auth/permissions')
const { getClosures } = require('../closure')

module.exports = [{
  method: 'GET',
  path: '/closure',
  options: {
    auth: { scope: [closureAdmin] },
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
    auth: { scope: [closureAdmin] },
    handler: async (request, h) => {
      await postProcessing('/closure/remove', { closedId: request.payload.closedId })
      return h.redirect('/closure')
    }
  }
}]
