const { statementAbbreviations } = require('../../constants/schemes')
const { filenameSearch } = require('./filename-search')

const constructedFilenameSearch = async (criteria) => {
  if (!(criteria?.schemeId && criteria?.marketingYear && criteria?.frn && criteria?.timestamp)) {
    return null
  }
  const schemeAbbrev = statementAbbreviations[criteria.schemeId]
  if (!schemeAbbrev) {
    return null
  }

  const filename = `FFC_PaymentDelinkedStatement_${schemeAbbrev}_${criteria.marketingYear}_${criteria.frn}_${criteria.timestamp}.pdf`
  return filenameSearch({ filename: `outbound/${filename}` })
}

module.exports = { constructedFilenameSearch }
