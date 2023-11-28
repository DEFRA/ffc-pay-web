const { get } = require('../api')
const { holdAdmin, schemeAdmin, dataView, closureAdmin } = require('../auth/permissions')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: { scope: [holdAdmin, schemeAdmin, dataView, closureAdmin] },
    handler: async (_request, h) => {
      const paymentHoldsResponse = await get('/payment-holds')
      const schemes = await get('/payment-schemes')
      const closures = await get('/agreement-closures')
      return h.view('home', {
        totalHolds: paymentHoldsResponse?.payload?.paymentHolds?.filter(x => x.dateTimeClosed == null).length ?? 0,
        totalSchemes: schemes?.payload?.paymentSchemes?.length ?? 0,
        totalClosures: closures?.payload?.closures?.length ?? 0
      })
    }
  }
}
