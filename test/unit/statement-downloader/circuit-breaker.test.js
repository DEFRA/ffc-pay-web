const { CircuitBreaker } = require('../../../app/statement-downloader/search-helpers/circuit-breaker')

describe('CircuitBreaker', () => {
  const timeoutMs = 1000
  const failureThreshold = 3
  const resetTimeoutMs = 5000

  let breaker

  beforeEach(() => {
    breaker = new CircuitBreaker(timeoutMs, failureThreshold, resetTimeoutMs)
  })

  describe('constructor', () => {
    test('should initialize with correct default values', () => {
      expect(breaker.timeoutMs).toBe(timeoutMs)
      expect(breaker.failureThreshold).toBe(failureThreshold)
      expect(breaker.resetTimeoutMs).toBe(resetTimeoutMs)
      expect(breaker.failureCount).toBe(0)
      expect(breaker.state).toBe('CLOSED')
      expect(breaker.nextAttempt).toBe(0)
    })
  })

  describe('isOpen', () => {
    test('should return true when state is OPEN', () => {
      breaker.state = 'OPEN'
      expect(breaker.isOpen()).toBe(true)
    })

    test('should return false when state is CLOSED', () => {
      breaker.state = 'CLOSED'
      expect(breaker.isOpen()).toBe(false)
    })

    test('should return false when state is HALF_OPEN', () => {
      breaker.state = 'HALF_OPEN'
      expect(breaker.isOpen()).toBe(false)
    })
  })

  describe('isHalfOpen', () => {
    test('should return true when state is HALF_OPEN', () => {
      breaker.state = 'HALF_OPEN'
      expect(breaker.isHalfOpen()).toBe(true)
    })

    test('should return false when state is CLOSED', () => {
      breaker.state = 'CLOSED'
      expect(breaker.isHalfOpen()).toBe(false)
    })

    test('should return false when state is OPEN', () => {
      breaker.state = 'OPEN'
      expect(breaker.isHalfOpen()).toBe(false)
    })
  })

  describe('markSuccess', () => {
    test('should reset failureCount, set state to CLOSED, and reset nextAttempt', () => {
      breaker.failureCount = 2
      breaker.state = 'HALF_OPEN'
      breaker.nextAttempt = 12345

      breaker.markSuccess()

      expect(breaker.failureCount).toBe(0)
      expect(breaker.state).toBe('CLOSED')
      expect(breaker.nextAttempt).toBe(0)
    })
  })

  describe('markFailure', () => {
    test('should increment failureCount when below threshold', () => {
      breaker.failureCount = 1
      breaker.markFailure()

      expect(breaker.failureCount).toBe(2)
      expect(breaker.state).toBe('CLOSED')
      expect(breaker.nextAttempt).toBe(0)
    })

    test('should set state to OPEN and set nextAttempt when failureCount reaches threshold', () => {
      breaker.failureCount = failureThreshold - 1
      const now = Date.now()
      breaker.markFailure()

      expect(breaker.failureCount).toBe(failureThreshold)
      expect(breaker.state).toBe('OPEN')
      expect(breaker.nextAttempt).toBeGreaterThanOrEqual(now + resetTimeoutMs)
    })

    test('should set state to OPEN and set nextAttempt when failureCount exceeds threshold', () => {
      breaker.failureCount = failureThreshold
      const now = Date.now()
      breaker.markFailure()

      expect(breaker.failureCount).toBe(failureThreshold + 1)
      expect(breaker.state).toBe('OPEN')
      expect(breaker.nextAttempt).toBeGreaterThanOrEqual(now + resetTimeoutMs)
    })
  })

  describe('shouldAttemptHalfOpen', () => {
    test('should return false when state is CLOSED', () => {
      breaker.state = 'CLOSED'
      expect(breaker.shouldAttemptHalfOpen()).toBe(false)
    })

    test('should return false when state is HALF_OPEN', () => {
      breaker.state = 'HALF_OPEN'
      expect(breaker.shouldAttemptHalfOpen()).toBe(false)
    })

    test('should throw error when state is OPEN and nextAttempt is in the future', () => {
      breaker.state = 'OPEN'
      breaker.nextAttempt = Date.now() + 10000

      expect(() => breaker.shouldAttemptHalfOpen()).toThrow('Statement-publisher circuit open')
      expect(breaker.state).toBe('OPEN')
    })

    test('should set state to HALF_OPEN and return true when state is OPEN and nextAttempt has passed', () => {
      breaker.state = 'OPEN'
      breaker.nextAttempt = Date.now() - 1000

      const result = breaker.shouldAttemptHalfOpen()

      expect(result).toBe(true)
      expect(breaker.state).toBe('HALF_OPEN')
    })
  })

  describe('handleSuccess', () => {
    test('should call markSuccess when state is HALF_OPEN', () => {
      breaker.state = 'HALF_OPEN'
      breaker.failureCount = 2
      breaker.nextAttempt = 12345

      breaker.handleSuccess()

      expect(breaker.failureCount).toBe(0)
      expect(breaker.state).toBe('CLOSED')
      expect(breaker.nextAttempt).toBe(0)
    })

    test('should reset failureCount when state is not HALF_OPEN', () => {
      breaker.state = 'CLOSED'
      breaker.failureCount = 2

      breaker.handleSuccess()

      expect(breaker.failureCount).toBe(0)
      expect(breaker.state).toBe('CLOSED')
      expect(breaker.nextAttempt).toBe(0)
    })

    test('should reset failureCount when state is OPEN', () => {
      breaker.state = 'OPEN'
      breaker.failureCount = 5

      breaker.handleSuccess()

      expect(breaker.failureCount).toBe(0)
      expect(breaker.state).toBe('OPEN') // State remains OPEN
      expect(breaker.nextAttempt).toBe(0)
    })
  })

  describe('getState', () => {
    test('should return current state, failureCount, and nextAttempt', () => {
      breaker.state = 'OPEN'
      breaker.failureCount = 3
      breaker.nextAttempt = 123456789

      const state = breaker.getState()

      expect(state).toEqual({
        state: 'OPEN',
        failureCount: 3,
        nextAttempt: 123456789
      })
    })
  })

  describe('integration tests', () => {
    test('should transition from CLOSED to OPEN after reaching failure threshold', () => {
      expect(breaker.state).toBe('CLOSED')

      for (let i = 0; i < failureThreshold; i++) {
        breaker.markFailure()
      }

      expect(breaker.state).toBe('OPEN')
      expect(breaker.failureCount).toBe(failureThreshold)
    })

    test('should transition from OPEN to HALF_OPEN after reset timeout', () => {
      // Reach OPEN state
      for (let i = 0; i < failureThreshold; i++) {
        breaker.markFailure()
      }
      expect(breaker.state).toBe('OPEN')

      // Simulate time passing
      breaker.nextAttempt = Date.now() - 1000

      const canAttempt = breaker.shouldAttemptHalfOpen()
      expect(canAttempt).toBe(true)
      expect(breaker.state).toBe('HALF_OPEN')
    })

    test('should transition from HALF_OPEN to CLOSED on success', () => {
      // Set to HALF_OPEN
      breaker.state = 'HALF_OPEN'
      breaker.failureCount = 2

      breaker.handleSuccess()

      expect(breaker.state).toBe('CLOSED')
      expect(breaker.failureCount).toBe(0)
    })

    test('should remain OPEN if HALF_OPEN attempt fails', () => {
      // Reach OPEN and then HALF_OPEN
      for (let i = 0; i < failureThreshold; i++) {
        breaker.markFailure()
      }
      breaker.nextAttempt = Date.now() - 1000
      breaker.shouldAttemptHalfOpen()
      expect(breaker.state).toBe('HALF_OPEN')

      // Fail in HALF_OPEN
      breaker.markFailure()
      expect(breaker.state).toBe('OPEN')
    })
  })
})
