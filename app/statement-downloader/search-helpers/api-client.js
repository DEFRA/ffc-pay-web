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
  const errStatus = err?.statusCode ?? err?.res?.statusCode ?? err?.output?.statusCode ?? null
  const errCode = err?.code ?? null
  console.error(`Statement-publisher request failed for ${fullUrl} - status: ${errStatus}, code: ${errCode}, message: ${err.message}`)
  if (err?.stack) {
    console.error(err.stack.split('\n').slice(0, 2).join('\n'))
  }

  const wrapperErr = new Error(`Statement-publisher request failed for ${fullUrl}: ${err.message || err}`)
  wrapperErr.orig = err
  throw wrapperErr
}

const executeApiCall = async (path, endpoint, breaker, timeoutMs) => {
  const fullUrl = `${endpoint}${path}`
  try {
    breaker.shouldAttemptHalfOpen()
  } catch (e) {
    console.info(`Statement-publisher circuit status: ${e.message}`)
    throw e
  }

  try {
    console.info(`Calling statement-publisher: ${fullUrl}`)
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
