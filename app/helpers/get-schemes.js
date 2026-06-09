const api = require('../api')

const getSchemes = async () => {
  const schemes = await api.getProcessingData('/payment-schemes')
  const schemesPayload = schemes.payload.paymentSchemes
  schemesPayload.forEach(scheme => {
    if (scheme.name === 'SFI') {
      scheme.name = 'SFI22'
    }
  })
  schemesPayload.sort((a, b) => a.schemeId > b.schemeId)
  return schemesPayload
}

module.exports = {
  getSchemes
}
