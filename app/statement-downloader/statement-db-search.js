const config = require('../config')
const { CircuitBreaker } = require('./search-helpers/circuit-breaker')
const { executeApiCall } = require('./search-helpers/api-client')
const { buildFilenameQueryPath, buildSearchQueryPath } = require('./search-helpers/query-builder')

const TIMEOUT_MS = Number(config.timeoutMs)
const FAILURE_THRESHOLD = Number(config.failureThreshold)
const RESET_TIMEOUT_MS = Number(config.resetTimeoutMs)

const breaker = new CircuitBreaker(TIMEOUT_MS, FAILURE_THRESHOLD, RESET_TIMEOUT_MS)

const getByFilename = async (filename) => {
  const path = buildFilenameQueryPath(filename)
  const payload = await executeApiCall(path, config.statementPublisherEndpoint, breaker, TIMEOUT_MS)

  if (!payload) {
    return null
  }

  const rows = payload?.statements ?? (Array.isArray(payload) ? payload : [payload])
  return rows[0] || null
}

const search = async (criteria = {}, limit = 100, offset = 0) => {
  const path = buildSearchQueryPath(criteria, limit, offset)
  const payload = await executeApiCall(path, config.statementPublisherEndpoint, breaker, TIMEOUT_MS)

  const rows = payload?.statements ?? payload?.rows ?? (Array.isArray(payload) ? payload : [])
  const continuationToken = payload?.continuationToken ?? (rows.length < limit ? null : offset + rows.length)

  return { statements: rows, continuationToken }
}

const getCircuitState = () => breaker.getState()

module.exports = { getByFilename, search, getCircuitState }
