const getCacheValue = async (cache, key) => {
  console.log(`Getting cache value for key: ${key}`)
  try {
    return await cache.get(key)
  } catch (err) {
    throw new Error(`No cache value for key: ${key}`)
  }
}

module.exports = getCacheValue
