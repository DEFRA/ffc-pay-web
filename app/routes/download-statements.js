const schema = require('./schemas/download-statements')
const { searchStatements, downloadStatement } = require('../storage/statement-search')
const { parseStatementFilename } = require('../helpers/parse-statement-filename')
const { BAD_REQUEST, SUCCESS, NOT_FOUND } = require('../constants/http-status-codes')
const { applicationAdmin } = require('../auth/permissions')
const { getStatementSchemes } = require('../helpers/get-statement-schemes')

const DOWNLOAD_VIEW = 'download-statements'

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
        const schemes = await getStatementSchemes()
        return h.view(DOWNLOAD_VIEW, { schemes, crumb: _request.plugins.crumb })
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
          const schemes = await getStatementSchemes()
          return h
            .view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, { error }))
            .code(BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const mergedPayload = parseAndMergeFilename(request.payload)
        const searchCriteria = buildSearchCriteria(mergedPayload)
        const schemes = await getStatementSchemes()

        try {
          const statements = await searchStatements(searchCriteria)

          return h.view(DOWNLOAD_VIEW, buildViewContext(schemes, request.payload, {
            statements,
            searchPerformed: true
          }))
        } catch (err) {
          const error = { message: err.message || 'An error occurred while searching for statements' }
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
          return h.response({ error: 'Statement not found' }).code(NOT_FOUND)
        }
      }
    }
  }
]
