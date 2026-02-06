const buildSearchParams = (criteria, limit, offset) => {
  const params = [
    criteria.frn !== undefined && criteria.frn !== null ? `frn=${encodeURIComponent(criteria.frn)}` : null,
    criteria.schemeShortName !== undefined && criteria.schemeShortName !== null ? `schemeshortname=${encodeURIComponent(criteria.schemeShortName)}` : null,
    criteria.schemeYear !== undefined && criteria.schemeYear !== null ? `schemeyear=${encodeURIComponent(criteria.schemeYear)}` : null,
    criteria.timestamp !== undefined && criteria.timestamp !== null && criteria.timestamp !== '' ? `timestamp=${encodeURIComponent(criteria.timestamp)}` : null,
    `limit=${encodeURIComponent(limit)}`,
    `offset=${encodeURIComponent(offset)}`
  ].filter(Boolean)

  return params.join('&')
}

const buildFilenameQueryPath = (filename) => {
  return `/statements?filename=${encodeURIComponent(filename)}`
}

const buildSearchQueryPath = (criteria, limit, offset) => {
  const queryString = buildSearchParams(criteria, limit, offset)
  return `/statements?${queryString}`
}

module.exports = {
  buildSearchParams,
  buildFilenameQueryPath,
  buildSearchQueryPath
}
