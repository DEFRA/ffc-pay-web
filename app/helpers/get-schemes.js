const api = require('../api')

const getSchemes = async () => {
  const schemes = await api.get('/payment-schemes')
  const schemesPayload = schemes.payload.paymentSchemes
  schemesPayload.forEach(scheme => {
    if (scheme.name === 'SFI') {
      scheme.name = 'SFI22'
    }
  })
  return schemesPayload
}

module.exports = {
  getSchemes
}
