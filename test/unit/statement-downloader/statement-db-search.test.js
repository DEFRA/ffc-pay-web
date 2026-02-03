const { getByFilename, search, getCircuitState } = require('../../../app/statement-downloader/statement-db-search')
const config = require('../../../app/config')
const { executeApiCall } = require('../../../app/statement-downloader/search-helpers/api-client')
const { buildFilenameQueryPath, buildSearchQueryPath } = require('../../../app/statement-downloader/search-helpers/query-builder')

jest.mock('../../../app/config')
jest.mock('../../../app/statement-downloader/search-helpers/api-client')
jest.mock('../../../app/statement-downloader/search-helpers/query-builder')
// DO NOT mock CircuitBreaker - it's instantiated at module load time before jest.mock takes effect

describe('statement-db-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set config to actual values found in test environment
    config.timeoutMs = '2000'
    config.failureThreshold = '5'
    config.resetTimeoutMs = '30000'
    config.statementPublisherEndpoint = 'https://publisher.example.com'
  })

  describe('getByFilename', () => {
    describe('basic functionality', () => {
      test('should build filename query path with provided filename', async () => {
        const filename = 'statement.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=statement.pdf')
        executeApiCall.mockResolvedValue({ statements: [{ id: 1, name: 'statement.pdf' }] })

        await getByFilename(filename)

        expect(buildFilenameQueryPath).toHaveBeenCalledWith(filename)
      })

      test('should call executeApiCall with correct parameters', async () => {
        const filename = 'test.pdf'
        const mockPath = '/statements?filename=test.pdf'
        buildFilenameQueryPath.mockReturnValue(mockPath)
        executeApiCall.mockResolvedValue({ statements: [{ id: 1 }] })

        await getByFilename(filename)

        // The CircuitBreaker instance is real and created at module load time
        // We check that executeApiCall was called with the correct path and timeout value
        expect(executeApiCall).toHaveBeenCalledWith(
          mockPath,
          config.statementPublisherEndpoint,
          expect.any(Object), // Real CircuitBreaker instance
          2000 // Number(config.timeoutMs) = 2000
        )
      })

      test('should return first row from statements array', async () => {
        const filename = 'statement.pdf'
        const mockPayload = {
          statements: [
            { id: 1, name: 'first.pdf' },
            { id: 2, name: 'second.pdf' }
          ]
        }
        buildFilenameQueryPath.mockReturnValue('/statements?filename=statement.pdf')
        executeApiCall.mockResolvedValue(mockPayload)

        const result = await getByFilename(filename)

        expect(result).toEqual({ id: 1, name: 'first.pdf' })
      })
    })

    describe('payload variations', () => {
      test('should return first row when payload has statements property', async () => {
        const filename = 'test.pdf'
        const mockRow = { id: 1, frn: '1234567890' }
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue({ statements: [mockRow] })

        const result = await getByFilename(filename)

        expect(result).toEqual(mockRow)
      })

      test('should handle array payload directly', async () => {
        const filename = 'test.pdf'
        const mockRow = { id: 1, frn: '1234567890' }
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue([mockRow])

        const result = await getByFilename(filename)

        expect(result).toEqual(mockRow)
      })

      test('should wrap single object in array and return it', async () => {
        const filename = 'test.pdf'
        const mockRow = { id: 1, frn: '1234567890' }
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue(mockRow)

        const result = await getByFilename(filename)

        expect(result).toEqual(mockRow)
      })

      test('should return null when payload is null', async () => {
        const filename = 'test.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue(null)

        const result = await getByFilename(filename)

        expect(result).toBeNull()
      })

      test('should return null when payload is undefined', async () => {
        const filename = 'test.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue(undefined)

        const result = await getByFilename(filename)

        expect(result).toBeNull()
      })

      test('should return null when statements array is empty', async () => {
        const filename = 'test.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockResolvedValue({ statements: [] })

        const result = await getByFilename(filename)

        expect(result).toBeNull()
      })
    })

    describe('error handling', () => {
      test('should propagate error from executeApiCall', async () => {
        const filename = 'test.pdf'
        const error = new Error('API call failed')
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockRejectedValue(error)

        await expect(getByFilename(filename)).rejects.toThrow('API call failed')
      })

      test('should propagate timeout error from executeApiCall', async () => {
        const filename = 'test.pdf'
        const error = new Error('Statement-publisher request timed out')
        error.code = 'DB_TIMEOUT'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockRejectedValue(error)

        await expect(getByFilename(filename)).rejects.toThrow('Statement-publisher request timed out')
      })

      test('should propagate circuit open error', async () => {
        const filename = 'test.pdf'
        const error = new Error('Statement-publisher circuit open')
        error.isCircuitOpen = true
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test.pdf')
        executeApiCall.mockRejectedValue(error)

        await expect(getByFilename(filename)).rejects.toThrow('Statement-publisher circuit open')
      })
    })

    describe('filename variations', () => {
      test('should handle filename with path', async () => {
        const filename = 'outbound/test.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=outbound/test.pdf')
        executeApiCall.mockResolvedValue({ statements: [{ id: 1 }] })

        await getByFilename(filename)

        expect(buildFilenameQueryPath).toHaveBeenCalledWith(filename)
      })

      test('should handle filename with special characters', async () => {
        const filename = 'test file & more.pdf'
        buildFilenameQueryPath.mockReturnValue('/statements?filename=test%20file%20%26%20more.pdf')
        executeApiCall.mockResolvedValue({ statements: [{ id: 1 }] })

        await getByFilename(filename)

        expect(buildFilenameQueryPath).toHaveBeenCalledWith(filename)
      })

      test('should handle empty filename', async () => {
        const filename = ''
        buildFilenameQueryPath.mockReturnValue('/statements?filename=')
        executeApiCall.mockResolvedValue({ statements: [{ id: 1 }] })

        await getByFilename(filename)

        expect(buildFilenameQueryPath).toHaveBeenCalledWith(filename)
      })
    })
  })

  describe('search', () => {
    describe('basic functionality', () => {
      test('should have default parameters', async () => {
        buildSearchQueryPath.mockReturnValue('/statements?limit=100&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search()

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, 100, 0)
      })

      test('should build search query path with criteria, limit, and offset', async () => {
        const criteria = { frn: '1234567890' }
        const limit = 50
        const offset = 25
        buildSearchQueryPath.mockReturnValue('/statements?frn=1234567890&limit=50&offset=25')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(criteria, limit, offset)

        expect(buildSearchQueryPath).toHaveBeenCalledWith(criteria, limit, offset)
      })

      test('should call executeApiCall with correct parameters', async () => {
        const criteria = { frn: '1234567890' }
        const mockPath = '/statements?frn=1234567890&limit=50&offset=0'
        buildSearchQueryPath.mockReturnValue(mockPath)
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(criteria, 50, 0)

        expect(executeApiCall).toHaveBeenCalledWith(
          mockPath,
          config.statementPublisherEndpoint,
          expect.any(Object), // Real CircuitBreaker instance
          2000 // Number(config.timeoutMs)
        )
      })

      test('should return statements and continuation token', async () => {
        const mockStatements = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: mockStatements, continuationToken: 'token-123' })

        const result = await search({}, 50, 0)

        expect(result).toEqual({
          statements: mockStatements,
          continuationToken: 'token-123'
        })
      })
    })

    describe('payload format variations', () => {
      test('should handle statements property in payload', async () => {
        const mockStatements = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: mockStatements })

        const result = await search({}, 50, 0)

        expect(result.statements).toEqual(mockStatements)
      })

      test('should handle rows property in payload', async () => {
        const mockRows = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ rows: mockRows })

        const result = await search({}, 50, 0)

        expect(result.statements).toEqual(mockRows)
      })

      test('should handle array payload directly', async () => {
        const mockArray = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue(mockArray)

        const result = await search({}, 50, 0)

        expect(result.statements).toEqual(mockArray)
      })

      test('should handle empty object payload', async () => {
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({})

        const result = await search({}, 50, 0)

        expect(result.statements).toEqual([])
      })
    })

    describe('continuation token logic', () => {
      test('should return provided continuation token from payload', async () => {
        const mockStatements = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({
          statements: mockStatements,
          continuationToken: 'next-page-token'
        })

        const result = await search({}, 50, 0)

        expect(result.continuationToken).toBe('next-page-token')
      })

      test('should calculate continuation token when not provided and rows exceed limit', async () => {
        const limit = 50
        const offset = 25
        const mockStatements = Array.from({ length: limit + 1 }, (_, i) => ({ id: i + 1 }))
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: mockStatements })

        const result = await search({}, limit, offset)

        expect(result.continuationToken).toBe(76) // 75.9 rounded up
      })

      test('should return null continuation token when rows less than limit', async () => {
        const limit = 50
        const offset = 0
        const mockStatements = [{ id: 1 }, { id: 2 }] // Less than limit
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: mockStatements })

        const result = await search({}, limit, offset)

        expect(result.continuationToken).toBeNull()
      })

      test('should calculate continuation token when rows equal limit (no payload token)', async () => {
        const limit = 2
        const offset = 0
        const mockStatements = [{ id: 1 }, { id: 2 }] // Exactly equals limit
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: mockStatements })

        const result = await search({}, limit, offset)

        // Implementation: rows.length (2) is NOT < limit (2), so it calculates offset + rows.length
        expect(result.continuationToken).toBe(offset + limit) // 0 + 2 = 2
      })

      test('should prefer payload continuation token over calculated token', async () => {
        const limit = 2
        const offset = 0
        const mockStatements = [{ id: 1 }, { id: 2 }]
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({
          statements: mockStatements,
          continuationToken: 'explicit-token'
        })

        const result = await search({}, limit, offset)

        expect(result.continuationToken).toBe('explicit-token')
      })
    })

    describe('criteria variations', () => {
      test('should handle criteria with all properties', async () => {
        const criteria = {
          frn: '1234567890',
          schemeShortName: 'SFI',
          schemeYear: 2024
        }
        const limit = 50
        const offset = 0
        buildSearchQueryPath.mockReturnValue('/statements?frn=1234567890&schemeshortname=SFI&schemeyear=2024&limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(criteria, limit, offset)

        expect(buildSearchQueryPath).toHaveBeenCalledWith(criteria, limit, offset)
      })

      test('should handle partial criteria', async () => {
        const criteria = { frn: '1234567890' }
        buildSearchQueryPath.mockReturnValue('/statements?frn=1234567890&limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(criteria, 50, 0)

        expect(buildSearchQueryPath).toHaveBeenCalledWith(criteria, 50, 0)
      })

      test('should handle empty criteria object', async () => {
        const criteria = {}
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(criteria, 50, 0)

        expect(buildSearchQueryPath).toHaveBeenCalledWith(criteria, 50, 0)
      })

      test('should handle null criteria by converting to empty object', async () => {
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search(undefined, 50, 0)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, 50, 0)
      })
    })

    describe('pagination parameters', () => {
      test('should use default limit of 100 when not provided', async () => {
        buildSearchQueryPath.mockReturnValue('/statements?limit=100&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search({}, undefined, 0)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, 100, 0)
      })

      test('should use default offset of 0 when not provided', async () => {
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockResolvedValue({ statements: [] })

        await search({}, 50, undefined)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, 50, 0)
      })

      test('should handle large limit values', async () => {
        const limit = 5000
        const offset = 1000
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: [] })

        await search({}, limit, offset)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, limit, offset)
      })

      test('should handle zero offset', async () => {
        const limit = 50
        const offset = 0
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: [] })

        await search({}, limit, offset)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, limit, offset)
      })

      test('should handle non-zero offset', async () => {
        const limit = 50
        const offset = 500
        buildSearchQueryPath.mockReturnValue(`/statements?limit=${limit}&offset=${offset}`)
        executeApiCall.mockResolvedValue({ statements: [] })

        await search({}, limit, offset)

        expect(buildSearchQueryPath).toHaveBeenCalledWith({}, limit, offset)
      })
    })

    describe('error handling', () => {
      test('should propagate error from executeApiCall', async () => {
        const error = new Error('API search failed')
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockRejectedValue(error)

        await expect(search({}, 50, 0)).rejects.toThrow('API search failed')
      })

      test('should propagate timeout error', async () => {
        const error = new Error('Statement-publisher request timed out')
        error.code = 'DB_TIMEOUT'
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockRejectedValue(error)

        await expect(search({}, 50, 0)).rejects.toThrow('Statement-publisher request timed out')
      })

      test('should propagate circuit open error', async () => {
        const error = new Error('Statement-publisher circuit open')
        error.isCircuitOpen = true
        buildSearchQueryPath.mockReturnValue('/statements?limit=50&offset=0')
        executeApiCall.mockRejectedValue(error)

        await expect(search({}, 50, 0)).rejects.toThrow('Statement-publisher circuit open')
      })
    })
  })

  describe('getCircuitState', () => {
    test('should return circuit breaker state object', () => {
      const result = getCircuitState()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('state')
      expect(result).toHaveProperty('failureCount')
      expect(result).toHaveProperty('nextAttempt')
    })

    test('should return state as string', () => {
      const result = getCircuitState()

      expect(typeof result.state).toBe('string')
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(result.state)
    })

    test('should return failureCount as number', () => {
      const result = getCircuitState()

      expect(typeof result.failureCount).toBe('number')
      expect(result.failureCount).toBeGreaterThanOrEqual(0)
    })

    test('should return nextAttempt as number', () => {
      const result = getCircuitState()

      expect(typeof result.nextAttempt).toBe('number')
      expect(result.nextAttempt).toBeGreaterThanOrEqual(0)
    })

    test('should return initial state as CLOSED with zero failureCount', () => {
      const result = getCircuitState()

      expect(result.state).toBe('CLOSED')
      expect(result.failureCount).toBe(0)
      expect(result.nextAttempt).toBe(0)
    })
  })

  describe('integration scenarios', () => {
    test('should handle complete search workflow', async () => {
      const criteria = { frn: '1234567890', schemeYear: 2024 }
      const limit = 50
      const offset = 0
      const mockStatements = [
        { id: 1, frn: '1234567890' },
        { id: 2, frn: '1234567890' }
      ]

      buildSearchQueryPath.mockReturnValue('/statements?frn=1234567890&schemeyear=2024&limit=50&offset=0')
      executeApiCall.mockResolvedValue({
        statements: mockStatements,
        continuationToken: null
      })

      const result = await search(criteria, limit, offset)

      expect(result.statements).toEqual(mockStatements)
      expect(result.continuationToken).toBeNull()
      expect(buildSearchQueryPath).toHaveBeenCalledWith(criteria, limit, offset)
      expect(executeApiCall).toHaveBeenCalled()
    })

    test('should handle pagination workflow', async () => {
      const criteria = { schemeYear: 2024 }
      const limit = 20
      const offset = 0

      // First page
      const firstPageStatements = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }))
      buildSearchQueryPath.mockReturnValue('/statements?schemeyear=2024&limit=20&offset=0')
      executeApiCall.mockResolvedValue({ statements: firstPageStatements })

      const firstResult = await search(criteria, limit, offset)

      expect(firstResult.statements.length).toBe(20)
      expect(firstResult.continuationToken).toBe(20) // offset + limit = 0 + 20

      // Second page
      jest.clearAllMocks()
      const secondPageStatements = [{ id: 21 }]
      buildSearchQueryPath.mockReturnValue('/statements?schemeyear=2024&limit=20&offset=20')
      executeApiCall.mockResolvedValue({ statements: secondPageStatements })

      const secondResult = await search(criteria, limit, 20)

      expect(secondResult.statements.length).toBe(1)
      expect(secondResult.continuationToken).toBeNull() // Less than limit
    })

    test('should handle filename and search workflows', async () => {
      // Filename search
      const filename = 'test-statement.pdf'
      buildFilenameQueryPath.mockReturnValue('/statements?filename=test-statement.pdf')
      executeApiCall.mockResolvedValue({ statements: [{ id: 1, frn: '1234567890' }] })

      const filenameResult = await getByFilename(filename)

      expect(filenameResult).toEqual({ id: 1, frn: '1234567890' })

      // Clear for next test
      jest.clearAllMocks()

      // Criteria search
      const criteria = { frn: '1234567890' }
      buildSearchQueryPath.mockReturnValue('/statements?frn=1234567890&limit=100&offset=0')
      executeApiCall.mockResolvedValue({ statements: [{ id: 1, frn: '1234567890' }] })

      const searchResult = await search(criteria, 100, 0)

      expect(searchResult.statements).toEqual([{ id: 1, frn: '1234567890' }])
    })
  })
})
