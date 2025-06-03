const { getSchemes } = require('./get-schemes')
const { BAD_REQUEST } = require('../constants/http-status')

function mapValidationErrors (details = []) {
  return details.map(({ message, path = [] }) => ({
    text: message,
    href: `#${path[0]}`
  }))
}

async function renderErrorPage (viewName, request, h, error) {
  request.log(['error', 'validation'], error)
  const errors = mapValidationErrors(error.details)
  const schemes = await getSchemes()

  return h
    .view(viewName, { schemes, errors })
    .code(BAD_REQUEST)
    .takeover()
}

module.exports = {
  renderErrorPage
}
