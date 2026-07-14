const { getSchemes } = require('./get-schemes')

const getView = async (path, h, extraData = {}) => {
  const schemes = await getSchemes()
  return h.view(path, { schemes, ...extraData })
}

module.exports = {
  getView
}
