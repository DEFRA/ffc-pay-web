class CircuitBreaker {
  constructor (timeoutMs, failureThreshold, resetTimeoutMs) {
    this.timeoutMs = timeoutMs
    this.failureThreshold = failureThreshold
    this.resetTimeoutMs = resetTimeoutMs
    this.failureCount = 0
    this.state = 'CLOSED'
    this.nextAttempt = 0
  }

  isOpen () {
    return this.state === 'OPEN'
  }

  isHalfOpen () {
    return this.state === 'HALF_OPEN'
  }

  markSuccess () {
    this.failureCount = 0
    this.state = 'CLOSED'
    this.nextAttempt = 0
  }

  markFailure () {
    this.failureCount += 1
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.resetTimeoutMs
    }
  }

  shouldAttemptHalfOpen () {
    if (!this.isOpen()) {
      return false
    }
    if (Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN'
      return true
    }
    const err = new Error('Statement-publisher circuit open')
    err.isCircuitOpen = true
    throw err
  }

  handleSuccess () {
    if (this.isHalfOpen()) {
      this.markSuccess()
    } else {
      this.failureCount = 0
    }
  }

  getState () {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    }
  }
}

module.exports = { CircuitBreaker }
