const schema = require('./schemas/download-statements')
const { downloadStatement } = require('../statement-downloader/statement-search')
const { BAD_REQUEST, SUCCESS, NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } = require('../constants/http-status-codes')
const { applicationAdmin } = require('../auth/permissions')
const { getStatementSchemes } = require('../helpers/get-statement-schemes')
const {
  buildViewContext,
  handleSchemesError,
  prepareSearchParams,
  performSearch
} = require('../statement-downloader/search-helpers/download-helper')

const DOWNLOAD_VIEW = 'download-statements'
const SCHEMES_ERROR = 'Unable to load schemes. Please try again later.'
const fileLimit = 50
const AUTH_SCOPE = { scope: [applicationAdmin] }

const handleGetDownloadStatements = async (_request, h) => {
  try {
    const schemes = await getStatementSchemes()
    return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, {}, { crumb: _request.plugins.crumb }))
  } catch (err) {
    console.error('Error fetching schemes:', err)
    return handleSchemesError(h, SCHEMES_ERROR)
  }
}

const handleValidationFailure = async (request, h, error) => {
  try {
    const schemes = await getStatementSchemes()
    return h
      .view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, { additionalContext: { error }, crumb: request.plugins.crumb }))
      .code(BAD_REQUEST)
      .takeover()
  } catch (err) {
    console.error('Error fetching schemes in validation failure:', err)
    return handleSchemesError(h, SCHEMES_ERROR)
  }
}

const handleSearchError = (searchResult, schemes, request, h) => {
  return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
    additionalContext: {
      error: { message: searchResult.error },
      searchPerformed: false
    },
    crumb: request.plugins.crumb
  }))
}

const handleStatementNotFound = (schemes, request, h) => {
  return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
    additionalContext: {
      error: { message: 'Statement not found' },
      searchPerformed: false
    },
    crumb: request.plugins.crumb
  }))
}

const handleSuccessfulSearch = (schemes, request, statements, nextToken, h) => {
  return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
    additionalContext: {
      statements,
      searchPerformed: true,
      continuationToken: nextToken
    },
    crumb: request.plugins.crumb
  }))
}

const handlePostError = async (err, schemes, request, h) => {
  const error = { message: err.message || 'An error occurred while searching for statements' }
  if (!schemes) {
    try {
      schemes = await getStatementSchemes()
    } catch (e) {
      console.error('Error fetching schemes after search failure:', e)
      return handleSchemesError(h, SCHEMES_ERROR)
    }
  }
  return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, { additionalContext: { error }, crumb: request.plugins.crumb }))
}

const handlePostDownloadStatements = async (request, h) => {
  try {
    const { searchCriteria, limit, offsetOrToken } = prepareSearchParams(request, fileLimit)
    const schemes = await getStatementSchemes()
    const searchResult = await performSearch(searchCriteria, limit, offsetOrToken)

    if (searchResult?.error) {
      return handleSearchError(searchResult, schemes, request, h)
    }

    const { statements, continuationToken: nextToken } = searchResult

    if (searchCriteria.filename && (!Array.isArray(statements) || statements.length === 0)) {
      return handleStatementNotFound(schemes, request, h)
    }

    return handleSuccessfulSearch(schemes, request, statements, nextToken, h)
  } catch (err) {
    console.error('Error in POST handler:', err)
    return handlePostError(err, undefined, request, h)
  }
}

const handleDownloadFile = async (request, h) => {
  try {
    const { filename } = request.params
    const download = await downloadStatement(filename)
    return h.response(download.readableStreamBody)
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .code(SUCCESS)
  } catch (err) {
    console.error('Download error:', err)
    if (err.statusCode === FORBIDDEN) {
      return h.response({ error: 'Access denied' }).code(FORBIDDEN)
    } else if (err.statusCode === NOT_FOUND || err.code === 'BlobNotFound') {
      return h.response({ error: 'Statement not found' }).code(NOT_FOUND)
    } else {
      return h.response({ error: 'An error occurred while downloading the statement' }).code(INTERNAL_SERVER_ERROR)
    }
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/download-statements',
    options: {
      auth: AUTH_SCOPE,
      handler: handleGetDownloadStatements
    }
  },
  {
    method: 'POST',
    path: '/download-statements',
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: handleValidationFailure
      },
      handler: handlePostDownloadStatements
    }
  },
  {
    method: 'GET',
    path: '/download-statements/download/{filename*}',
    options: {
      auth: AUTH_SCOPE,
      handler: handleDownloadFile
    }
  }
]
