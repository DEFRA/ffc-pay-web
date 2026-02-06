const {
  calculatePageNumber,
  parseAndMergeFilename,
  buildSearchCriteria,
  buildViewContext,
  handleSchemesError,
  prepareSearchParams,
  performSearch
} = require('../../../app/statement-downloader/search-helpers/download-helper')
const { searchStatements } = require('../../../app/statement-downloader/statement-search')
const { parseStatementFilename } = require('../../../app/helpers/parse-statement-filename')
const { INTERNAL_SERVER_ERROR } = require('../../../app/constants/http-status-codes')

jest.mock('../../../app/statement-downloader/statement-search')
jest.mock('../../../app/helpers/parse-statement-filename')

describe('download-helper utilities', () => {
  let consoleInfoSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    parseStatementFilename.mockReturnValue({ isValid: false })
    searchStatements.mockResolvedValue({ statements: [], continuationToken: null })
  })

  afterEach(() => {
    consoleInfoSpy.mockRestore()
  })

  describe('calculatePageNumber', () => {
    test('should return 1 when pageNumber is not provided', () => {
      const result = calculatePageNumber({})
      expect(result).toBe(1)
    })

    test('should return pageNumber + 1 when pageNumber is provided', () => {
      const result = calculatePageNumber({ pageNumber: 2 })
      expect(result).toBe(3)
    })

    test('should handle string pageNumber', () => {
      const result = calculatePageNumber({ pageNumber: '5' })
      expect(result).toBe(6)
    })

    test('should handle zero pageNumber', () => {
      const result = calculatePageNumber({ pageNumber: 0 })
      expect(result).toBe(1)
    })
  })

  describe('parseAndMergeFilename', () => {
    test('should return payload unchanged when no filename', () => {
      const payload = { schemeId: '1' }
      const result = parseAndMergeFilename(payload)
      expect(result).toEqual(payload)
    })

    test('should return payload unchanged when filename parsing fails', () => {
      parseStatementFilename.mockReturnValue({ isValid: false })
      const payload = { filename: 'test.pdf', schemeId: '1' }
      const result = parseAndMergeFilename(payload)
      expect(result).toEqual(payload)
    })

    test('should merge parsed data with payload when parsing succeeds', () => {
      parseStatementFilename.mockReturnValue({
        isValid: true,
        schemeId: '2',
        marketingYear: '2024',
        frn: '1234567890',
        timestamp: '20240101120000'
      })
      const payload = { filename: 'test.pdf', schemeId: '1' }
      const result = parseAndMergeFilename(payload)
      expect(result).toEqual({
        filename: 'test.pdf',
        schemeId: '1', // payload takes precedence
        marketingYear: '2024',
        frn: '1234567890',
        timestamp: '20240101120000'
      })
    })

    test('should handle null parsed result', () => {
      parseStatementFilename.mockReturnValue(null)
      const payload = { filename: 'test.pdf' }
      const result = parseAndMergeFilename(payload)
      expect(result).toEqual(payload)
    })

    test('should handle undefined parsed result', () => {
      parseStatementFilename.mockReturnValue(undefined)
      const payload = { filename: 'test.pdf' }
      const result = parseAndMergeFilename(payload)
      expect(result).toEqual(payload)
    })
  })

  describe('buildSearchCriteria', () => {
    test('should build criteria with all fields', () => {
      const payload = {
        filename: 'test.pdf',
        schemeId: '1',
        marketingYear: '2024',
        frn: '1234567890',
        timestamp: '20240101120000'
      }
      const result = buildSearchCriteria(payload)
      expect(result).toEqual({
        filename: 'test.pdf',
        schemeId: 1,
        marketingYear: 2024,
        frn: 1234567890,
        timestamp: '20240101120000'
      })
    })

    test('should handle null/undefined values', () => {
      const payload = {}
      const result = buildSearchCriteria(payload)
      expect(result).toEqual({
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        timestamp: undefined
      })
    })

    test('should convert strings to numbers', () => {
      const payload = { schemeId: '2', marketingYear: '2023', frn: '9876543210' }
      const result = buildSearchCriteria(payload)
      expect(result).toEqual({
        filename: null,
        schemeId: 2,
        marketingYear: 2023,
        frn: 9876543210,
        timestamp: undefined
      })
    })

    test('should handle invalid number strings', () => {
      const payload = { schemeId: 'invalid', marketingYear: 'not-a-number' }
      const result = buildSearchCriteria(payload)
      expect(result).toEqual({
        filename: null,
        schemeId: NaN,
        marketingYear: NaN,
        frn: null,
        timestamp: undefined
      })
    })
  })

  describe('buildViewContext', () => {
    test('should build context with all fields', () => {
      const schemes = [{ id: 1 }]
      const payload = {
        filename: 'test.pdf',
        schemeId: '1',
        marketingYear: '2024',
        frn: '123',
        timestamp: '20240101',
        limit: '50',
        continuationToken: 'token'
      }
      const result = buildViewContext(schemes, payload, { additionalContext: { error: 'test' }, crumb: 'crumb' })
      expect(result).toEqual({
        schemes,
        filename: 'test.pdf',
        schemeId: '1',
        marketingYear: '2024',
        frn: '123',
        timestamp: '20240101',
        limit: '50',
        continuationToken: 'token',
        pageNumber: 1,
        crumb: 'crumb',
        error: 'test'
      })
    })

    test('should handle empty additionalContext', () => {
      const schemes = []
      const payload = {}
      const result = buildViewContext(schemes, payload, {})
      expect(result).toEqual({
        schemes: [],
        filename: undefined,
        schemeId: undefined,
        marketingYear: undefined,
        frn: undefined,
        timestamp: undefined,
        limit: undefined,
        continuationToken: undefined,
        pageNumber: 1,
        crumb: undefined
      })
    })

    test('should calculate pageNumber correctly', () => {
      const schemes = []
      const payload = { pageNumber: 3 }
      const result = buildViewContext(schemes, payload, {})
      expect(result.pageNumber).toBe(4)
    })

    test('should handle null additionalContext', () => {
      const schemes = []
      const payload = {}
      const result = buildViewContext(schemes, payload, { additionalContext: null, crumb: null })
      expect(result).toEqual({
        schemes: [],
        filename: undefined,
        schemeId: undefined,
        marketingYear: undefined,
        frn: undefined,
        timestamp: undefined,
        limit: undefined,
        continuationToken: undefined,
        pageNumber: 1,
        crumb: null,
        ...null // This will spread null, but test accordingly
      })
    })
  })

  describe('handleSchemesError', () => {
    test('should return response with error and INTERNAL_SERVER_ERROR', () => {
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis()
      }
      const result = handleSchemesError(mockH, 'Test error')
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Test error' })
      expect(mockH.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
      expect(result).toBe(mockH)
    })
  })

  describe('prepareSearchParams', () => {
    const fileLimit = 50

    test('should prepare params with default limit and no token', () => {
      const request = { payload: { schemeId: '1' } }
      const result = prepareSearchParams(request, fileLimit)
      expect(result).toEqual({
        searchCriteria: {
          filename: null,
          schemeId: 1,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        },
        limit: 50,
        offsetOrToken: null,
        mergedPayload: { schemeId: '1' }
      })
    })

    test('should handle custom limit', () => {
      const request = { payload: { limit: '100' } }
      const result = prepareSearchParams(request, fileLimit)
      expect(result.limit).toBe(100)
    })

    test('should handle continuation token', () => {
      const request = { payload: { continuationToken: 'token123' } }
      const result = prepareSearchParams(request, fileLimit)
      expect(result.offsetOrToken).toBe('token123')
    })

    test('should calculate offset from pageNumber', () => {
      const request = { payload: { pageNumber: '2' } }
      const result = prepareSearchParams(request, fileLimit)
      expect(result.offsetOrToken).toBe(100) // 2 * 50
    })

    test('should prefer continuationToken over pageNumber', () => {
      const request = { payload: { pageNumber: '2', continuationToken: 'token' } }
      const result = prepareSearchParams(request, fileLimit)
      expect(result.offsetOrToken).toBe('token')
    })

    test('should handle null additionalContext', () => {
      const schemes = []
      const payload = {}
      const result = buildViewContext(schemes, payload, { additionalContext: null, crumb: null })
      expect(result).toEqual({
        schemes: [],
        filename: undefined,
        schemeId: undefined,
        marketingYear: undefined,
        frn: undefined,
        timestamp: undefined,
        limit: undefined,
        continuationToken: undefined,
        pageNumber: 1,
        crumb: null,
        ...null // This will spread null, but test accordingly
      })
    })
  })

  describe('performSearch', () => {
    test('should call searchStatements and log criteria', async () => {
      const searchCriteria = { schemeId: 1 }
      const limit = 50
      const offsetOrToken = null

      await performSearch(searchCriteria, limit, offsetOrToken)

      expect(consoleInfoSpy).toHaveBeenCalledWith('Download-statements search criteria: %o', searchCriteria)
      expect(searchStatements).toHaveBeenCalledWith(searchCriteria, limit, offsetOrToken)
    })

    test('should return search result', async () => {
      const mockResult = { statements: [{ id: 1 }], continuationToken: 'next' }
      searchStatements.mockResolvedValue(mockResult)

      const result = await performSearch({}, 10, 'token')

      expect(result).toEqual(mockResult)
    })

    test('should handle search error', async () => {
      const error = new Error('Search failed')
      searchStatements.mockRejectedValue(error)

      await expect(performSearch({}, 10, null)).rejects.toThrow('Search failed')
    })

    test('should handle undefined offsetOrToken', async () => {
      await performSearch({ schemeId: 1 }, 50, undefined)
      expect(searchStatements).toHaveBeenCalledWith({ schemeId: 1 }, 50, undefined)
    })
  })
})
