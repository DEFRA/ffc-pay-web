const config = require('../config')

const setCacheValue = async (cache, key, value) => {
  console.debug(`Populating cache with: ${key}:${value}`)
  try {
    await cache.set(key, value, config.cache.ttl)
    return true
  } catch (err) {
    console.error(`Cannot set cache ${key}:${value}`, err)
    return false
  }
}

module.exports = setCacheValue
