const { getSchemes } = require('./get-schemes')
const { BAD_REQUEST } = require('../constants/http-status-codes')

function mapValidationErrors (details = []) {
  return details.map(({ message, path = [] }) => ({
    text: message,
    href: `#${path[0]}`
  }))
}

function mapValidationErrorsByField (details = []) {
  return details.reduce((acc, { message, path = [] }) => {
    const key = path[0]
    if (key && !acc[key]) {
      acc[key] = message
    }
    return acc
  }, {})
}

async function renderErrorPage (viewName, request, h, error) {
  request.log(['error', 'validation'], error)
  const details = error.details || []
  const errors = mapValidationErrors(details)
  const errorMessages = mapValidationErrorsByField(details)
  const schemes = await getSchemes()
  const {
    schemeId = '',
    year = '',
    prn = '',
    frn = '',
    revenueOrCapital = ''
  } = request.query || {}

  return h
    .view(viewName, {
      schemes,
      errors,
      errorMessages,
      selectedSchemeId: schemeId,
      year,
      prn,
      frn,
      revenueOrCapital
    })
    .code(BAD_REQUEST)
    .takeover()
}

module.exports = {
  renderErrorPage
}
