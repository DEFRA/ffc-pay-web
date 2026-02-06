const { searchStatements } = require('../statement-search')
const { parseStatementFilename } = require('../../helpers/parse-statement-filename')
const { INTERNAL_SERVER_ERROR } = require('../../constants/http-status-codes')

const calculatePageNumber = (payload) => {
  if (payload.pageNumber) {
    return Number(payload.pageNumber) + 1
  }
  return 1
}

const parseAndMergeFilename = (payload) => {
  if (!payload.filename) {
    return payload
  }

  const parsed = parseStatementFilename(payload.filename)
  if (!parsed?.isValid) {
    return payload
  }

  return {
    filename: payload.filename,
    schemeId: payload.schemeId || parsed.schemeId,
    marketingYear: payload.marketingYear || parsed.marketingYear,
    frn: payload.frn || parsed.frn,
    timestamp: payload.timestamp || parsed.timestamp
  }
}

const buildSearchCriteria = (payload) => {
  return {
    filename: payload.filename ? payload.filename : null,
    schemeId: payload.schemeId ? Number.parseInt(payload.schemeId) : null,
    marketingYear: payload.marketingYear ? Number.parseInt(payload.marketingYear) : null,
    frn: payload.frn ? Number.parseInt(payload.frn) : null,
    timestamp: payload.timestamp
  }
}

const buildViewContext = (schemes, payload, { additionalContext = {}, crumb } = {}) => {
  const pageNumber = calculatePageNumber(payload)

  return {
    schemes,
    filename: payload.filename,
    schemeId: payload.schemeId,
    marketingYear: payload.marketingYear,
    frn: payload.frn,
    timestamp: payload.timestamp,
    limit: payload.limit || undefined,
    continuationToken: payload.continuationToken || undefined,
    pageNumber,
    crumb,
    ...additionalContext
  }
}

const handleSchemesError = (h, errorMessage) => {
  return h.response({ error: errorMessage }).code(INTERNAL_SERVER_ERROR)
}

const prepareSearchParams = (request, fileLimit) => {
  const mergedPayload = parseAndMergeFilename(request.payload)
  const searchCriteria = buildSearchCriteria(mergedPayload)
  const limit = request.payload.limit ? Math.floor(Number(request.payload.limit)) : fileLimit
  const continuationToken = request.payload.continuationToken || null

  let offsetOrToken = continuationToken
  if (!continuationToken && Object.hasOwn(request.payload, 'pageNumber')) {
    const pageIndex = Number(request.payload.pageNumber) || 0
    offsetOrToken = pageIndex * limit
  }

  return { searchCriteria, limit, offsetOrToken, mergedPayload }
}

const performSearch = async (searchCriteria, limit, offsetOrToken) => {
  console.info('Download-statements search criteria: %o', searchCriteria)
  return searchStatements(searchCriteria, limit, offsetOrToken)
}

module.exports = {
  calculatePageNumber,
  parseAndMergeFilename,
  buildSearchCriteria,
  buildViewContext,
  handleSchemesError,
  prepareSearchParams,
  performSearch
}
