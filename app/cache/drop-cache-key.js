const dropCacheKey = async (cache, key) => {
  console.debug(`Dropping cache key: ${key}`)
  try {
    return cache.drop(key)
  } catch (err) {
    console.error(`Cannot drop cache key: ${key}`, err)
    return undefined
  }
}

module.exports = dropCacheKey
