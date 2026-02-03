const schema = require('./schemas/download-statements')
const { searchStatements, downloadStatement } = require('../statement-downloader/statement-search')
const { parseStatementFilename } = require('../helpers/parse-statement-filename')
const { BAD_REQUEST, SUCCESS, NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } = require('../constants/http-status-codes')
const { applicationAdmin } = require('../auth/permissions')
const { getStatementSchemes } = require('../helpers/get-statement-schemes')

const DOWNLOAD_VIEW = 'download-statements'
const SCHEMES_ERROR = 'Unable to load schemes. Please try again later.'
const fileLimit = 50

const AUTH_SCOPE = { scope: [applicationAdmin] }

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
    filename: payload.filename || null,
    schemeId: payload.schemeId ? Number.parseInt(payload.schemeId) : null,
    marketingYear: payload.marketingYear ? Number.parseInt(payload.marketingYear) : null,
    frn: payload.frn ? Number.parseInt(payload.frn) : null,
    timestamp: payload.timestamp
  }
}

const buildViewContext = (schemes, payload, additionalContext = {}) => {
  return {
    schemes,
    filename: payload.filename,
    schemeId: payload.schemeId,
    marketingYear: payload.marketingYear,
    frn: payload.frn,
    timestamp: payload.timestamp,
    limit: payload.limit || undefined,
    continuationToken: payload.continuationToken || undefined,
    ...additionalContext
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/download-statements',
    options: {
      auth: AUTH_SCOPE,
      handler: async (_request, h) => {
        try {
          const schemes = await getStatementSchemes()
          return h.view(DOWNLOAD_VIEW, { schemes, crumb: _request.plugins.crumb })
        } catch (err) {
          console.error('Error fetching schemes:', err)
          return h.response({ error: SCHEMES_ERROR }).code(INTERNAL_SERVER_ERROR)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/download-statements',
    options: {
      auth: AUTH_SCOPE,
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          try {
            const schemes = await getStatementSchemes()
            return h
              .view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, { error }))
              .code(BAD_REQUEST)
              .takeover()
          } catch (err) {
            console.error('Error fetching schemes in validation failure:', err)
            return h.response({ error: SCHEMES_ERROR }).code(INTERNAL_SERVER_ERROR)
          }
        }
      },
      handler: async (request, h) => {
        try {
          const mergedPayload = parseAndMergeFilename(request.payload)
          const searchCriteria = buildSearchCriteria(mergedPayload)
          const schemes = await getStatementSchemes()
          const limit = Number(request.payload.limit) || fileLimit
          const continuationToken = request.payload.continuationToken || null

          console.info('Download-statements search criteria: %o', searchCriteria)

          const searchResult = await searchStatements(searchCriteria, limit, continuationToken)

          if (searchResult?.error) {
            return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
              error: { message: searchResult.error },
              searchPerformed: false
            }))
          }

          const { statements, continuationToken: nextToken } = searchResult

          if (searchCriteria.filename && (!Array.isArray(statements) || statements.length === 0)) {
            return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
              error: { message: 'Statement not found' },
              searchPerformed: false
            }))
          }

          return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
            statements,
            searchPerformed: true,
            continuationToken: nextToken
          }))
        } catch (err) {
          console.error('Error in POST handler:', err)
          const error = { message: err.message || 'An error occurred while searching for statements' }
          let schemes
          try {
            schemes = await getStatementSchemes()
          } catch (e) {
            console.error('Error fetching schemes after search failure:', e)
            return h.response({ error: SCHEMES_ERROR }).code(INTERNAL_SERVER_ERROR)
          }
          return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, { error }))
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/download-statements/download/{filename*}',
    options: {
      auth: AUTH_SCOPE,
      handler: async (request, h) => {
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
    }
  }
]
