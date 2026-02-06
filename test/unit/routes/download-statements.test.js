const downloadStatementsRoute = require('../../../app/routes/download-statements')
const { getStatementSchemes } = require('../../../app/helpers/get-statement-schemes')

jest.mock('../../../app/statement-downloader/statement-search')
jest.mock('../../../app/helpers/get-statement-schemes')
jest.mock('../../../app/statement-downloader/search-helpers/download-helper')

describe('download-statements route - GET', () => {
  let mockRequest
  let mockH
  let mockResponse
  let consoleErrorSpy
  let buildViewContext
  let handleSchemesError

  const MOCK_CRUMB = 'test-crumb-value'
  const MOCK_SCHEMES = [
    { schemeId: 1, name: 'SFI' },
    { schemeId: 2, name: 'BPS' },
    { schemeId: 4, name: 'DP' }
  ]
  const INTERNAL_SERVER_ERROR = 500

  beforeEach(() => {
    jest.clearAllMocks()

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    }

    mockH = {
      view: jest.fn().mockReturnValue(mockResponse),
      response: jest.fn().mockReturnValue(mockResponse)
    }

    mockRequest = {
      payload: {},
      params: {},
      plugins: {
        crumb: MOCK_CRUMB
      }
    }

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    getStatementSchemes.mockResolvedValue(MOCK_SCHEMES)

    const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
    buildViewContext = helperMock.buildViewContext
    handleSchemesError = helperMock.handleSchemesError

    buildViewContext.mockImplementation((schemes, payload, { additionalContext = {}, crumb } = {}) => {
      const pageNumber = 1
      return {
        schemes,
        filename: payload.filename,
        schemeId: payload.schemeId,
        marketingYear: payload.marketingYear,
        frn: payload.frn,
        timestamp: payload.timestamp,
        limit: payload.limit || undefined,
        continuationToken: payload.continuationToken || undefined,
        pageNumber,
        crumb,
        ...additionalContext
      }
    })
    handleSchemesError.mockImplementation((h, errorMessage) => {
      return h.response({ error: errorMessage }).code(INTERNAL_SERVER_ERROR)
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('route configuration', () => {
    test('should have three routes defined', () => {
      expect(downloadStatementsRoute).toHaveLength(3)
    })

    test('should have GET route for /download-statements', () => {
      const getRoute = downloadStatementsRoute[0]
      expect(getRoute.method).toBe('GET')
      expect(getRoute.path).toBe('/download-statements')
      expect(getRoute.options.auth.scope).toEqual([require('../../../app/auth/permissions').applicationAdmin])
    })

    test('should have POST route for /download-statements', () => {
      const postRoute = downloadStatementsRoute[1]
      expect(postRoute.method).toBe('POST')
      expect(postRoute.path).toBe('/download-statements')
      expect(postRoute.options.auth.scope).toEqual([require('../../../app/auth/permissions').applicationAdmin])
      expect(postRoute.options.validate.payload).toBe(require('../../../app/routes/schemas/download-statements'))
      expect(typeof postRoute.options.validate.failAction).toBe('function')
    })

    test('should have GET route for /download-statements/download/{filename*}', () => {
      const downloadRoute = downloadStatementsRoute[2]
      expect(downloadRoute.method).toBe('GET')
      expect(downloadRoute.path).toBe('/download-statements/download/{filename*}')
      expect(downloadRoute.options.auth.scope).toEqual([require('../../../app/auth/permissions').applicationAdmin])
    })
  })

  describe('GET /download-statements', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[0].options.handler
    })

    test('should return view with schemes and crumb', async () => {
      await handler(mockRequest, mockH)

      expect(getStatementSchemes).toHaveBeenCalledTimes(1)
      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, {}, { crumb: MOCK_CRUMB })
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.any(Object))
    })

    test('should handle empty schemes array', async () => {
      getStatementSchemes.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith([], {}, { crumb: MOCK_CRUMB })
    })

    test('should handle error fetching schemes', async () => {
      const error = new Error('Failed to fetch schemes')
      getStatementSchemes.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching schemes:', error)
      expect(handleSchemesError).toHaveBeenCalledWith(mockH, 'Unable to load schemes. Please try again later.')
    })

    test('should handle undefined crumb value', async () => {
      mockRequest.plugins.crumb = undefined

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, {}, { crumb: undefined })
    })
  })

  describe('handleValidationFailure', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[1].options.validate.failAction
    })

    test('should return view with schemes and error on success', async () => {
      const error = { message: 'Validation error' }

      await handler(mockRequest, mockH, error)

      expect(getStatementSchemes).toHaveBeenCalledTimes(1)
      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, { additionalContext: { error }, crumb: MOCK_CRUMB })
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.any(Object))
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').BAD_REQUEST)
      expect(mockResponse.takeover).toHaveBeenCalled()
    })

    test('should handle error fetching schemes', async () => {
      const error = { message: 'Validation error' }
      getStatementSchemes.mockRejectedValue(new Error('Schemes error'))

      await handler(mockRequest, mockH, error)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching schemes in validation failure:', expect.any(Error))
      expect(handleSchemesError).toHaveBeenCalledWith(mockH, 'Unable to load schemes. Please try again later.')
    })
  })

  describe('POST /download-statements', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[1].options.handler
    })

    test('should handle successful search', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockReturnValue({ searchCriteria: { filename: 'test.pdf' }, limit: 50, offsetOrToken: undefined })
      helperMock.performSearch.mockResolvedValue({ statements: [{ filename: 'test.pdf' }], continuationToken: 'token' })

      await handler(mockRequest, mockH)

      expect(getStatementSchemes).toHaveBeenCalled()
      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, {
        additionalContext: { statements: [{ filename: 'test.pdf' }], searchPerformed: true, continuationToken: 'token' },
        crumb: MOCK_CRUMB
      })
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.any(Object))
    })

    test('should handle search error', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockReturnValue({ searchCriteria: {}, limit: 50, offsetOrToken: undefined })
      helperMock.performSearch.mockResolvedValue({ error: 'Search failed' })

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, {
        additionalContext: { error: { message: 'Search failed' }, searchPerformed: false },
        crumb: MOCK_CRUMB
      })
    })

    test('should handle statement not found', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockReturnValue({ searchCriteria: { filename: 'notfound.pdf' }, limit: 50, offsetOrToken: undefined })
      helperMock.performSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, {
        additionalContext: { error: { message: 'Statement not found' }, searchPerformed: false },
        crumb: MOCK_CRUMB
      })
    })

    test('should handle performSearch error', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockReturnValue({ searchCriteria: {}, limit: 50, offsetOrToken: undefined })
      helperMock.performSearch.mockRejectedValue(new Error('Perform error'))

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, { additionalContext: { error: { message: 'Perform error' } }, crumb: MOCK_CRUMB })
    })

    test('should handle post error', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockImplementation(() => { throw new Error('Prepare error') })

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in POST handler:', expect.any(Error))
      expect(buildViewContext).toHaveBeenCalledWith(MOCK_SCHEMES, mockRequest.payload, { additionalContext: { error: { message: 'Prepare error' } }, crumb: MOCK_CRUMB })
    })

    test('should handle post error with schemes fetch failure', async () => {
      const helperMock = require('../../../app/statement-downloader/search-helpers/download-helper')
      helperMock.prepareSearchParams.mockImplementation(() => { throw new Error('Prepare error') })
      getStatementSchemes.mockRejectedValue(new Error('Schemes error'))

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching schemes after search failure:', expect.any(Error))
      expect(handleSchemesError).toHaveBeenCalledWith(mockH, 'Unable to load schemes. Please try again later.')
    })
  })

  describe('GET /download-statements/download/{filename*}', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[2].options.handler
      mockRequest.params = { filename: 'test.pdf' }
    })

    test('should download file successfully', async () => {
      const mockStream = { readableStreamBody: 'stream' }
      require('../../../app/statement-downloader/statement-search').downloadStatement.mockResolvedValue(mockStream)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith('stream')
      expect(mockResponse.type).toHaveBeenCalledWith('application/pdf')
      expect(mockResponse.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="test.pdf"')
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').SUCCESS)
    })

    test('should handle forbidden error', async () => {
      const error = { statusCode: require('../../../app/constants/http-status-codes').FORBIDDEN }
      require('../../../app/statement-downloader/statement-search').downloadStatement.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Access denied' })
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').FORBIDDEN)
    })

    test('should handle not found error', async () => {
      const error = { statusCode: require('../../../app/constants/http-status-codes').NOT_FOUND }
      require('../../../app/statement-downloader/statement-search').downloadStatement.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').NOT_FOUND)
    })

    test('should handle blob not found', async () => {
      const error = { code: 'BlobNotFound' }
      require('../../../app/statement-downloader/statement-search').downloadStatement.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').NOT_FOUND)
    })

    test('should handle internal error', async () => {
      const error = new Error('Download failed')
      require('../../../app/statement-downloader/statement-search').downloadStatement.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'An error occurred while downloading the statement' })
      expect(mockResponse.code).toHaveBeenCalledWith(require('../../../app/constants/http-status-codes').INTERNAL_SERVER_ERROR)
    })
  })
})
