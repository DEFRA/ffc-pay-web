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
})
