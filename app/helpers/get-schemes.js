const api = require('../api')
const { SCHEMES_PATH } = require('../constants/common-api-urls')

const getSchemes = async () => {
  const schemes = await api.getProcessingData(SCHEMES_PATH)
  const schemesPayload = schemes.payload.paymentSchemes
  schemesPayload.forEach(scheme => {
    if (scheme.name === 'SFI') {
      scheme.name = 'SFI22'
    }
    if (scheme.name === 'Vet Visits') {
      scheme.name = 'Annual Health and Welfare Review'
    }
  })
  schemesPayload.sort((a, b) => a.name.localeCompare(b.name))
  return schemesPayload
}

module.exports = {
  getSchemes
}
