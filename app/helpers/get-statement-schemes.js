const { getSchemes } = require('./get-schemes')
const { statementAbbreviations } = require('../constants/statement-abbreviations')

const getStatementSchemes = async () => {
  const allSchemes = await getSchemes()

  const statementSchemeIds = new Set(
    Object.keys(statementAbbreviations).map(Number)
  )

  return allSchemes
    .filter(scheme => statementSchemeIds.has(scheme.schemeId))
}

module.exports = {
  getStatementSchemes
}
