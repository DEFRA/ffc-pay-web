const { getSchemeIds } = require('ffc-pay-schemes')

const { SFI, DELINKED } = getSchemeIds()

const statementAbbreviations = {
  [DELINKED]: 'DP',
  [SFI]: 'SFI'
}

module.exports = {
  statementAbbreviations
}
