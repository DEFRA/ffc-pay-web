const { getSchemes } = require('./get-schemes')
const HTTP_BAD_REQUEST = 400

const renderErrorPage = async (view, request, h, err) => {
  request.log(['error', 'validation'], err)
  const errors = err.details
    ? err.details.map(detail => {
      return {
        text: detail.message,
        href: '#' + detail.path[0]
      }
    })
    : []
  const schemes = await getSchemes()
  return h.view(view, { schemes, errors }).code(HTTP_BAD_REQUEST).takeover()
}

module.exports = {
  renderErrorPage
}
