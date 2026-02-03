const { executeApiCall, createTimeoutPromise, isNotFoundError, isTimeoutError } = require('../../../app/statement-downloader/search-helpers/api-client')
const api = require('../../../app/api')
const { CircuitBreaker } = require('../../../app/statement-downloader/search-helpers/circuit-breaker')
const { NOT_FOUND } = require('../../../app/constants/http-status-codes')

jest.mock('../../../app/api')
jest.mock('../../../app/statement-downloader/search-helpers/circuit-breaker')

describe('api-client', () => {
  const path = '/test-path'
  const endpoint = 'https://test-endpoint.com'
  const timeoutMs = 1000
  const mockBreaker = {
    shouldAttemptHalfOpen: jest.fn(),
    handleSuccess: jest.fn(),
    markFailure: jest.fn(),
    isHalfOpen: jest.fn(),
    state: 'CLOSED',
    resetTimeoutMs: 5000
  }

  beforeEach(() => {
    jest.clearAllMocks()
    CircuitBreaker.mockImplementation(() => mockBreaker)
  })

  describe('createTimeoutPromise', () => {
    test('should reject with DB_TIMEOUT error after specified ms', async () => {
      const start = Date.now()
      const promise = createTimeoutPromise(100)

      await expect(promise).rejects.toThrow('API query timed out')
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(95) // Allow some tolerance
      expect(end - start).toBeLessThan(150)
    })

    test('should set error code to DB_TIMEOUT', async () => {
      const promise = createTimeoutPromise(10)

      try {
        await promise
      } catch (err) {
        expect(err.code).toBe('DB_TIMEOUT')
      }
    })
  })

  describe('isNotFoundError', () => {
    test('should return true for statusCode 404', () => {
      const err = { statusCode: NOT_FOUND }
      expect(isNotFoundError(err)).toBe(true)
    })

    test('should return true for res.statusCode 404', () => {
      const err = { res: { statusCode: NOT_FOUND } }
      expect(isNotFoundError(err)).toBe(true)
    })

    test('should return true for output.statusCode 404', () => {
      const err = { output: { statusCode: NOT_FOUND } }
      expect(isNotFoundError(err)).toBe(true)
    })

    test('should return false for other status codes', () => {
      const err = { statusCode: 500 }
      expect(isNotFoundError(err)).toBe(false)
    })

    test('should return false for no status', () => {
      const err = {}
      expect(isNotFoundError(err)).toBe(false)
    })

    test('should return false for null/undefined err', () => {
      expect(isNotFoundError(null)).toBe(false)
      expect(isNotFoundError(undefined)).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    test('should return true for DB_TIMEOUT code', () => {
      const err = { code: 'DB_TIMEOUT' }
      expect(isTimeoutError(err)).toBe(true)
    })

    test('should return false for other codes', () => {
      const err = { code: 'OTHER_ERROR' }
      expect(isTimeoutError(err)).toBe(false)
    })

    test('should return false for no code', () => {
      const err = {}
      expect(isTimeoutError(err)).toBe(false)
    })
  })

  describe('executeApiCall', () => {
    const mockResult = { data: 'test' }

    beforeEach(() => {
      api.getStatementPublisherData.mockResolvedValue(mockResult)
      mockBreaker.shouldAttemptHalfOpen.mockReturnValue(true)
    })

    test('should call shouldAttemptHalfOpen on breaker', async () => {
      await executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      expect(mockBreaker.shouldAttemptHalfOpen).toHaveBeenCalled()
    })

    test('should call api.getStatementPublisherData with path', async () => {
      await executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      expect(api.getStatementPublisherData).toHaveBeenCalledWith(path)
    })

    test('should return result and call handleSuccess on success', async () => {
      const result = await executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      expect(result).toBe(mockResult)
      expect(mockBreaker.handleSuccess).toHaveBeenCalled()
    })

    test('should handle timeout error', async () => {
      api.getStatementPublisherData.mockImplementation(() => new Promise(() => {})) // Never resolves

      const promise = executeApiCall(path, endpoint, mockBreaker, 10)

      await expect(promise).rejects.toThrow('Statement-publisher request timed out for https://test-endpoint.com/test-path')
      expect(mockBreaker.markFailure).toHaveBeenCalled()
    })

    test('should return null for 404 error', async () => {
      const notFoundError = { statusCode: NOT_FOUND }
      api.getStatementPublisherData.mockRejectedValue(notFoundError)

      const result = await executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      expect(result).toBe(null)
      expect(mockBreaker.markFailure).not.toHaveBeenCalled()
    })

    test('should handle other errors and mark failure', async () => {
      const otherError = new Error('Other error')
      api.getStatementPublisherData.mockRejectedValue(otherError)
      mockBreaker.isHalfOpen.mockReturnValue(false)

      const promise = executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      await expect(promise).rejects.toThrow('Statement-publisher request failed for https://test-endpoint.com/test-path: Other error')
      expect(mockBreaker.markFailure).toHaveBeenCalled()
    })

    test('should set breaker to OPEN if half open on other error', async () => {
      const otherError = new Error('Other error')
      api.getStatementPublisherData.mockRejectedValue(otherError)
      mockBreaker.isHalfOpen.mockReturnValue(true)

      const promise = executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      await expect(promise).rejects.toThrow()
      expect(mockBreaker.markFailure).toHaveBeenCalled()
      expect(mockBreaker.state).toBe('OPEN')
      expect(mockBreaker.nextAttempt).toBeGreaterThan(Date.now())
    })

    test('should throw circuit open error if shouldAttemptHalfOpen throws', async () => {
      const circuitError = new Error('Circuit open')
      circuitError.isCircuitOpen = true
      mockBreaker.shouldAttemptHalfOpen.mockImplementation(() => {
        throw circuitError
      })

      const promise = executeApiCall(path, endpoint, mockBreaker, timeoutMs)

      await expect(promise).rejects.toThrow(circuitError)
      expect(api.getStatementPublisherData).not.toHaveBeenCalled()
    })
  })
})
