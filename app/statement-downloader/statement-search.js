const { filenameSearch } = require('./search-helpers/filename-search')
const { constructedFilenameSearch } = require('./search-helpers/constructed-filename-search')
const { dbSearch } = require('./search-helpers/db-search')
const { blobListingSearch } = require('./search-helpers/blob-listing-search')
const { downloadStatement } = require('./search-helpers/download-statement')
const { validateAndNormalizeLimit, validateContinuationToken, hasCriteria } = require('./search-helpers/search-validators')

const DEFAULT_SEARCH_LIMIT = 50

const safeDbSearch = async (pageLimit, token, criteria) => {
  const offset = (token !== null && /^\d+$/.test(String(token))) ? Number(token) : 0

  try {
    console.info('DB search: limit=%d offset=%o', pageLimit, offset)
    return await dbSearch(pageLimit, offset, criteria)
  } catch (err) {
    console.warn('DB search failed, falling back to blob listing:', err?.message || err)
    return null
  }
}

const searchStatements = async (criteria, limit = DEFAULT_SEARCH_LIMIT, continuationToken = null) => {
  const pageLimit = validateAndNormalizeLimit(limit)
  const token = validateContinuationToken(continuationToken)

  if (!hasCriteria(criteria)) {
    return { statements: [], continuationToken: null, error: 'At least one search criterion must be provided' }
  }

  const steps = [
    () => { return filenameSearch(criteria) },
    () => { return constructedFilenameSearch(criteria) },
    () => { return safeDbSearch(pageLimit, token, criteria) },
    () => { return blobListingSearch(pageLimit, token, criteria) }
  ]

  for (const step of steps) {
    const result = await step()
    if (result && Array.isArray(result.statements) && result.statements.length > 0) {
      return result
    }
    if (result && Array.isArray(result.statements) && result.statements.length === 0 && step === steps[0]) {
      return result
    }
  }

  return { statements: [], continuationToken: null }
}

module.exports = {
  searchStatements,
  downloadStatement
}
