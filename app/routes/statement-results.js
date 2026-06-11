const schema = require('./schemas/download-statements')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { applicationAdmin, statusReportsDelinked } = require('../auth/permissions')
const {
  buildViewContext,
  prepareSearchParams,
  performSearch
} = require('../statement-downloader/search-helpers/download-helper')

const RESULTS_VIEW = 'statement-results'
const fileLimit = 100
const AUTH_SCOPE = { scope: [applicationAdmin, statusReportsDelinked] }

const handleValidationFailure = (request, h, error) => {
  return h
    .view(RESULTS_VIEW, buildViewContext(null, request.query, { additionalContext: { error } }))
    .code(BAD_REQUEST)
    .takeover()
}

const handleGetStatementResults = async (request, h) => {
  try {
    const { searchCriteria, limit, offsetOrToken } = prepareSearchParams(request.query, fileLimit)
    const searchResult = await performSearch(searchCriteria, limit, offsetOrToken)

    if (searchResult?.error) {
      return h.view(RESULTS_VIEW, buildViewContext(null, request.query, {
        additionalContext: { error: { message: searchResult.error } }
      }))
    }

    const { statements, continuationToken: nextToken, totalCount } = searchResult
    return h.view(RESULTS_VIEW, buildViewContext(null, request.query, {
      additionalContext: { statements, continuationToken: nextToken, totalCount }
    }))
  } catch (err) {
    console.error('Error in GET statement-results handler:', err)
    const error = { message: err.message || 'An error occurred while searching for statements' }
    return h.view(RESULTS_VIEW, buildViewContext(null, request.query, { additionalContext: { error } }))
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/statement-results',
    options: {
      auth: AUTH_SCOPE,
      validate: {
        query: schema,
        failAction: handleValidationFailure
      },
      handler: handleGetStatementResults
    }
  }
]
