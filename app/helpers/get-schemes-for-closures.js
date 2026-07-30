const { MANUAL } = require('../constants/schemes')
const { getSchemes } = require('./get-schemes')

const getSchemesForClosures = async () => {
  const schemes = await getSchemes()
  return schemes.filter(scheme => scheme.schemeId !== MANUAL)
}

module.exports = {
  getSchemesForClosures
}
