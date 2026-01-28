const { statementAbbreviations } = require('../constants/schemes')
const { getSchemes } = require('./get-schemes')

const getStatementSchemes = async () => {
  const allSchemes = await getSchemes()

  const statementSchemeIds = new Set(
    Object.keys(statementAbbreviations).map(Number)
  )

  return allSchemes
    .filter(scheme => statementSchemeIds.has(scheme.schemeId))
    .map(scheme => ({
      ...scheme,
      name: scheme.name === 'SFI22' ? 'SFI' : scheme.name
    }))
}

module.exports = {
  getStatementSchemes
}
