const getCache = require('./get-cache')
const setCacheValue = require('./set-cache-value')

const set = async (request, key, value) => {
  await setCacheValue(getCache(request), key, value)
}

module.exports = set
