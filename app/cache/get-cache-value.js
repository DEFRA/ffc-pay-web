const getCacheValue = async (cache, key) => {
  try {
    return await cache.get(key)
  } catch (err) {
    throw new Error(`No cache value for key: ${key}`)
  }
}

module.exports = getCacheValue
