jest.mock('../../../app/statement-downloader/search-helpers/download-helper', () => ({
  buildViewContext: jest.fn(),
  prepareSearchParams: jest.fn(),
  performSearch: jest.fn()
}))

const statementResultsRoute = require('../../../app/routes/statement-results')
const schema = require('../../../app/routes/schemas/download-statements')
const { BAD_REQUEST } = require('../../../app/constants/http-status-codes')
const { applicationAdmin, statusReportsDelinked } = require('../../../app/auth/permissions')
const {
  buildViewContext,
  prepareSearchParams,
  performSearch
} = require('../../../app/statement-downloader/search-helpers/download-helper')

describe('statement-results route', () => {
  const RESULTS_VIEW = 'statement-results'
  const FILE_LIMIT = 100

  let mockRequest
  let mockH
  let mockResponse
  let handler
  let failAction
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }

    mockH = {
      view: jest.fn().mockReturnValue(mockResponse)
    }

    mockRequest = {
      query: {
        schemeId: '1',
        pageNumber: '2'
      }
    }

    handler = statementResultsRoute[0].options.handler
    failAction = statementResultsRoute[0].options.validate.failAction

    buildViewContext.mockImplementation((_schemes, query, { additionalContext = {} } = {}) => ({
      ...query,
      ...additionalContext
    }))

    prepareSearchParams.mockReturnValue({
      searchCriteria: { schemeId: 1 },
      limit: FILE_LIMIT,
      offsetOrToken: 100
    })

    performSearch.mockResolvedValue({
      statements: [],
      continuationToken: null,
      totalCount: 0
    })

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('route configuration', () => {
    test('defines a single GET /statement-results route', () => {
      expect(statementResultsRoute).toHaveLength(1)

      const route = statementResultsRoute[0]
      expect(route.method).toBe('GET')
      expect(route.path).toBe('/statement-results')
      expect(route.options.auth.scope).toEqual([applicationAdmin, statusReportsDelinked])
      expect(route.options.validate.query).toBe(schema)
      expect(typeof route.options.validate.failAction).toBe('function')
      expect(typeof route.options.handler).toBe('function')
    })
  })

  describe('validation failAction', () => {
    test('returns BAD_REQUEST and takeover with validation error context', () => {
      const error = { message: 'Validation failed' }

      failAction(mockRequest, mockH, error)

      expect(buildViewContext).toHaveBeenCalledWith(null, mockRequest.query, {
        additionalContext: { error }
      })
      expect(mockH.view).toHaveBeenCalledWith(RESULTS_VIEW, expect.any(Object))
      expect(mockResponse.code).toHaveBeenCalledWith(BAD_REQUEST)
      expect(mockResponse.takeover).toHaveBeenCalledTimes(1)
    })
  })

  describe('GET /statement-results', () => {
    test('renders statements when search succeeds', async () => {
      const params = {
        searchCriteria: { schemeId: 1, marketingYear: 2024 },
        limit: 25,
        offsetOrToken: 50
      }
      const searchResult = {
        statements: [{ filename: 'statement.pdf' }],
        continuationToken: 'next-token',
        totalCount: 101
      }

      prepareSearchParams.mockReturnValueOnce(params)
      performSearch.mockResolvedValueOnce(searchResult)

      await handler(mockRequest, mockH)

      expect(prepareSearchParams).toHaveBeenCalledWith(mockRequest.query, FILE_LIMIT)
      expect(performSearch).toHaveBeenCalledWith(params.searchCriteria, params.limit, params.offsetOrToken)
      expect(buildViewContext).toHaveBeenCalledWith(null, mockRequest.query, {
        additionalContext: {
          statements: searchResult.statements,
          continuationToken: searchResult.continuationToken,
          totalCount: searchResult.totalCount
        }
      })
      expect(mockH.view).toHaveBeenCalledWith(RESULTS_VIEW, expect.any(Object))
    })

    test('renders error context when performSearch returns an error payload', async () => {
      performSearch.mockResolvedValueOnce({ error: 'Search service unavailable' })

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(null, mockRequest.query, {
        additionalContext: { error: { message: 'Search service unavailable' } }
      })
      expect(mockH.view).toHaveBeenCalledWith(RESULTS_VIEW, expect.any(Object))
    })

    test('handles thrown errors using error.message', async () => {
      const err = new Error('Search exploded')
      performSearch.mockRejectedValueOnce(err)

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in GET statement-results handler:', err)
      expect(buildViewContext).toHaveBeenCalledWith(null, mockRequest.query, {
        additionalContext: { error: { message: 'Search exploded' } }
      })
      expect(mockH.view).toHaveBeenCalledWith(RESULTS_VIEW, expect.any(Object))
    })

    test('uses default error message when thrown value has no message', async () => {
      performSearch.mockRejectedValueOnce({ statusCode: 500 })

      await handler(mockRequest, mockH)

      expect(buildViewContext).toHaveBeenCalledWith(null, mockRequest.query, {
        additionalContext: { error: { message: 'An error occurred while searching for statements' } }
      })
      expect(mockH.view).toHaveBeenCalledWith(RESULTS_VIEW, expect.any(Object))
    })
  })
})
