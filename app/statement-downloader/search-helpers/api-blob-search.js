const { search: dbSearch } = require('../statement-db-search')
const { getStatementsContainer } = require('./get-statement-parts')
const { statementAbbreviations } = require('../../constants/schemes')

const createStatementResultFromService = (statement, downloadResponse = null) => {
  if (!statement?.filename) {
    return null
  }
  const schemeAbbrev = statementAbbreviations[statement.schemeId] || statement.schemeId

  return {
    filename: statement.filename,
    scheme: schemeAbbrev,
    year: statement.marketingYear?.toString(),
    frn: statement.frn?.toString(),
    timestamp: statement.timestamp,
    size: downloadResponse?.contentLength ?? null,
    lastModified: downloadResponse?.lastModified ?? statement.received ?? null,
    statementId: statement.statementId ?? null
  }
}

const apiBlobSearch = async (pageLimit, continuationToken = null, criteria = {}) => {
  const offset = continuationToken ? Number(continuationToken) : 0
  const queryCriteria = {
    ...criteria,
    ...(criteria.schemeId && { schemeshortname: statementAbbreviations[criteria.schemeId] })
  }
  delete queryCriteria.schemeId

  const serviceResponse = await dbSearch(queryCriteria, pageLimit, offset)

  if (!serviceResponse?.statements || serviceResponse.statements.length === 0) {
    return { statements: [], continuationToken: null }
  }

  const statementsContainer = await getStatementsContainer()
  const statements = []

  for (const statement of serviceResponse.statements) {
    try {
      const blobClient = statementsContainer.getBlobClient(statement.filename)
      const downloadResponse = await blobClient.download()
      statements.push(createStatementResultFromService(statement, downloadResponse))
    } catch (err) {
      console.warn(`Failed to download ${statement.filename}:`, err.message)
    }
  }

  return { statements, continuationToken: serviceResponse.continuationToken }
}

module.exports = {
  createStatementResultFromService,
  apiBlobSearch
}
