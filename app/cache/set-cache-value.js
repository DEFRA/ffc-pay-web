const config = require('../config')

const setCacheValue = async (cache, key, value) => {
  console.log(`Populating cache with: ${key}:${value}`)
  try {
    await cache.set(key, value, config.cache.ttl)
  } catch {
    console.error(`Cannot set cache ${key}:${value}`)
    return undefined
  }
}

module.exports = setCacheValue
