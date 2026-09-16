const { getSchemes: getUnorderedSchemes } = require('ffc-pay-schemes')

const getSchemes = () => {
  const schemes = getUnorderedSchemes()
  return schemes.sort((a, b) => a.schemeName.localeCompare(b.schemeName))
}

module.exports = {
  getSchemes
}
