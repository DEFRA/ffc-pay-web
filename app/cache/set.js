const getCache = require('./get-cache')
const setCacheValue = require('./set-cache-value')

const set = async (request, key, value) => {
  const cache = getCache(request)
  console.log('Cache object:', cache)
  await setCacheValue(cache, key, value)
}

module.exports = set
