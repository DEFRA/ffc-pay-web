const schema = require('../schemas/download-statements')
const { downloadStatement } = require('../../statement-downloader/statement-search')
const { BAD_REQUEST, SEE_OTHER, SUCCESS, NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } = require('../../constants/http-status-codes')
const { applicationAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked } = require('../../auth/permissions')
const { getStatementSchemes } = require('../../helpers/get-statement-schemes')
const { buildViewContext, handleSchemesError } = require('../../statement-downloader/search-helpers/download-helper')
const { sendRequestsLog } = require('../../statement-downloader/statement-db-search')

const DOWNLOAD_VIEW = 'statements/download-statements'
const SCHEMES_ERROR = 'Unable to load schemes. Please try again later.'
const AUTH_SCOPE = { scope: [applicationAdmin, schemeAdmin, dataView, statusReportsDelinked, statusReportSfi23] }

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

const handlePostDownloadStatements = (request, h) => {
  const params = new URLSearchParams()
  const fields = ['filename', 'schemeId', 'marketingYear', 'frn', 'timestamp', 'limit']
  for (const field of fields) {
    const val = request.payload[field]
    if (val !== undefined && val !== null && String(val) !== '') {
      params.set(field, val)
    }
  }
  params.set('pageNumber', '0')
  return h.redirect(`/statement-results?${params.toString()}`).code(SEE_OTHER)
}

const handleDownloadFile = async (request, h) => {
  try {
    const { filename } = request.params
    const user = request.auth?.credentials.account
    const userNameOrEmail = user?.name || user?.username || user?.email
    const requestType = 'Download'

    await sendRequestsLog({
      username: userNameOrEmail,
      filename,
      type: requestType,
      timestamp: new Date().toISOString()
    })

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
