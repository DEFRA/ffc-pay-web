const getCache = require('./get-cache')
const dropCacheKey = require('./drop-cache-key')

const drop = async (request, key) => {
  await dropCacheKey(getCache(request), key)
}

module.exports = drop
