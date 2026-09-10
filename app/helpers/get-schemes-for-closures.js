const { getSchemeIds } = require('ffc-pay-schemes')
const { getSchemes } = require('./get-schemes')

const { MANUAL } = getSchemeIds()

const getSchemesForClosures = async () => {
  const schemes = await getSchemes()
  return schemes.filter(scheme => scheme.schemeId !== MANUAL)
}

module.exports = {
  getSchemesForClosures
}
