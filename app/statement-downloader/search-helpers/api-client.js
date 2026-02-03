const api = require('../../api')
const { NOT_FOUND } = require('../../constants/http-status-codes')

const createTimeoutPromise = (ms) => {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      const err = new Error('API query timed out')
      err.code = 'DB_TIMEOUT'
      reject(err)
    }, ms)
  })
}

const isNotFoundError = (err) => {
  const status = err?.statusCode ?? err?.res?.statusCode ?? err?.output?.statusCode ?? null
  return status === NOT_FOUND
}

const isTimeoutError = (err) => {
  return err.code === 'DB_TIMEOUT'
}

const handleApiError = (err, fullUrl, breaker) => {
  if (isNotFoundError(err)) {
    console.info(`Statement-publisher returned 404 for ${fullUrl}`)
    return null
  }

  if (isTimeoutError(err)) {
    const toErr = new Error(`Statement-publisher request timed out for ${fullUrl}`)
    toErr.code = 'DB_TIMEOUT'
    toErr.isTimeout = true
    breaker.markFailure()
    throw toErr
  }

  breaker.markFailure()
  if (breaker.isHalfOpen()) {
    breaker.state = 'OPEN'
    breaker.nextAttempt = Date.now() + breaker.resetTimeoutMs
  }

  const out = new Error(`Statement-publisher request failed for ${fullUrl}: ${err.message || err}`)
  out.orig = err
  throw out
}

const executeApiCall = async (path, endpoint, breaker, timeoutMs) => {
  const fullUrl = `${endpoint}${path}`
  breaker.shouldAttemptHalfOpen()

  try {
    const apiCall = api.getStatementPublisherData(path)
    const result = await Promise.race([apiCall, createTimeoutPromise(timeoutMs)])
    breaker.handleSuccess()
    return result
  } catch (err) {
    return handleApiError(err, fullUrl, breaker)
  }
}

module.exports = {
  executeApiCall,
  createTimeoutPromise,
  isNotFoundError,
  isTimeoutError
}
