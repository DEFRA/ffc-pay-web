const db = require('../statement-db-search')
const { statementAbbreviations } = require('../../constants/schemes')
const { createStatementResultFromDBRow } = require('./create-statement')

const dbSearch = async (pageLimit, offset, criteria = {}) => {
  const schemeShortName = criteria.schemeId ? statementAbbreviations[criteria.schemeId] : undefined
  const payload = await db.search({
    frn: criteria.frn,
    schemeShortName,
    schemeYear: criteria.marketingYear
  }, pageLimit, offset)

  const rows = payload?.statements ?? payload?.rows ?? (Array.isArray(payload) ? payload : [])
  if (!Array.isArray(rows) || rows.length === 0) {
    return { statements: [], continuationToken: null }
  }

  const mapped = rows.map((r) => createStatementResultFromDBRow(r)).filter(Boolean)
  const continuationToken = payload?.continuationToken ?? (mapped.length < pageLimit ? null : offset + mapped.length)
  return { statements: mapped, continuationToken }
}

module.exports = { dbSearch }
