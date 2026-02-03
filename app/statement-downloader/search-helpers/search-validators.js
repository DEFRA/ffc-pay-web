const DEFAULT_SEARCH_LIMIT = 50
const MAX_SEARCH_LIMIT = 200

const validateAndNormalizeLimit = (limit) => {
  const normalized = Number(limit)
  if (Number.isNaN(normalized)) {
    return DEFAULT_SEARCH_LIMIT
  }
  return Math.min(normalized, MAX_SEARCH_LIMIT)
}

const validateContinuationToken = (continuationToken) => {
  if (!continuationToken) {
    return null
  }
  if (typeof continuationToken === 'string') {
    return continuationToken
  }
  return null
}

const hasCriteria = (criteria) => {
  return !!(
    criteria?.filename ||
    criteria?.schemeId ||
    criteria?.marketingYear ||
    criteria?.frn ||
    criteria?.timestamp
  )
}

module.exports = {
  validateAndNormalizeLimit,
  validateContinuationToken,
  hasCriteria
}
