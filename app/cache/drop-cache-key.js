const dropCacheKey = async (cache, key) => {
  console.log(`Dropping cache key: ${key}`)
  try {
    return cache.drop(key)
  } catch (err) {
    console.error(`Cannot drop cache key: ${key}`)
    return undefined
  }
}

module.exports = dropCacheKey
