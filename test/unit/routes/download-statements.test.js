const downloadStatementsRoute = require('../../../app/routes/download-statements')
const { searchStatements, downloadStatement } = require('../../../app/statement-downloader/statement-search')
const { parseStatementFilename } = require('../../../app/helpers/parse-statement-filename')
const { getStatementSchemes } = require('../../../app/helpers/get-statement-schemes')
const { BAD_REQUEST, SUCCESS, NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } = require('../../../app/constants/http-status-codes')
const { applicationAdmin } = require('../../../app/auth/permissions')

jest.mock('../../../app/statement-downloader/statement-search')
jest.mock('../../../app/helpers/parse-statement-filename')
jest.mock('../../../app/helpers/get-statement-schemes')

describe('download-statements route', () => {
  let mockRequest
  let mockH
  let mockResponse
  let consoleErrorSpy
  let consoleInfoSpy

  const mockSchemes = [
    { schemeId: 1, name: 'SFI' },
    { schemeId: 2, name: 'BPS' },
    { schemeId: 4, name: 'DP' }
  ]

  const mockStatements = [
    {
      filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf',
      scheme: 'SFI',
      year: '2024',
      frn: '1000000000',
      timestamp: '20240915120000',
      size: 1024,
      lastModified: new Date('2024-09-15')
    },
    {
      filename: 'FFC_PaymentDelinkedStatement_BPS_2024_1000000001_20240916120000.pdf',
      scheme: 'BPS',
      year: '2024',
      frn: '1000000001',
      timestamp: '20240916120000',
      size: 2048,
      lastModified: new Date('2024-09-16')
    }
  ]

  const mockReadableStream = {
    readableStreamBody: 'mock-pdf-stream'
  }

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
        crumb: 'test-crumb-value'
      }
    }

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()

    getStatementSchemes.mockResolvedValue(mockSchemes)
    parseStatementFilename.mockReturnValue({ isValid: false })
    searchStatements.mockResolvedValue({ statements: mockStatements, continuationToken: null })
    downloadStatement.mockResolvedValue(mockReadableStream)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleInfoSpy.mockRestore()
  })

  describe('route configuration', () => {
    test('should have three routes defined', () => {
      expect(downloadStatementsRoute).toHaveLength(3)
    })

    test('should have GET route for /download-statements', () => {
      const getRoute = downloadStatementsRoute[0]
      expect(getRoute.method).toBe('GET')
      expect(getRoute.path).toBe('/download-statements')
      expect(getRoute.options.auth.scope).toEqual([applicationAdmin])
    })

    test('should have POST route for /download-statements', () => {
      const postRoute = downloadStatementsRoute[1]
      expect(postRoute.method).toBe('POST')
      expect(postRoute.path).toBe('/download-statements')
      expect(postRoute.options.auth.scope).toEqual([applicationAdmin])
      expect(postRoute.options.validate).toBeDefined()
    })

    test('should have GET route for /download-statements/download/{filename*}', () => {
      const downloadRoute = downloadStatementsRoute[2]
      expect(downloadRoute.method).toBe('GET')
      expect(downloadRoute.path).toBe('/download-statements/download/{filename*}')
      expect(downloadRoute.options.auth.scope).toEqual([applicationAdmin])
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
      expect(mockH.view).toHaveBeenCalledWith('download-statements', {
        schemes: mockSchemes,
        crumb: 'test-crumb-value'
      })
    })

    test('should handle empty schemes array', async () => {
      getStatementSchemes.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('download-statements', {
        schemes: [],
        crumb: 'test-crumb-value'
      })
    })

    test('should handle error fetching schemes', async () => {
      const error = new Error('Failed to fetch schemes')
      getStatementSchemes.mockRejectedValue(error)

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching schemes:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Unable to load schemes. Please try again later.' })
      expect(mockResponse.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
    })

    test('should handle undefined crumb value', async () => {
      mockRequest.plugins.crumb = undefined

      await handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('download-statements', {
        schemes: mockSchemes,
        crumb: undefined
      })
    })
  })

  describe('POST /download-statements', () => {
    let handler
    let failAction

    beforeEach(() => {
      handler = downloadStatementsRoute[1].options.handler
      failAction = downloadStatementsRoute[1].options.validate.failAction
    })

    describe('validation failAction', () => {
      const mockError = {
        message: 'Validation failed',
        details: [
          { message: 'schemeId is required', path: ['schemeId'] }
        ]
      }

      test('should fetch schemes on validation failure', async () => {
        mockRequest.payload = { schemeId: '' }

        await failAction(mockRequest, mockH, mockError)

        expect(getStatementSchemes).toHaveBeenCalledTimes(1)
      })

      test('should return view with error and BAD_REQUEST status', async () => {
        mockRequest.payload = {
          filename: 'test.pdf',
          schemeId: '1',
          marketingYear: '2023'
        }

        await failAction(mockRequest, mockH, mockError)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', {
          schemes: mockSchemes,
          filename: 'test.pdf',
          schemeId: '1',
          marketingYear: '2023',
          frn: undefined,
          timestamp: undefined,
          limit: undefined,
          continuationToken: undefined,
          error: mockError
        })
        expect(mockResponse.code).toHaveBeenCalledWith(BAD_REQUEST)
        expect(mockResponse.takeover).toHaveBeenCalled()
      })

      test('should handle empty payload in validation failure', async () => {
        mockRequest.payload = {}

        await failAction(mockRequest, mockH, mockError)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', {
          schemes: mockSchemes,
          filename: undefined,
          schemeId: undefined,
          marketingYear: undefined,
          frn: undefined,
          timestamp: undefined,
          limit: undefined,
          continuationToken: undefined,
          error: mockError
        })
      })

      test('should handle error fetching schemes during validation failure', async () => {
        const schemeError = new Error('Scheme fetch failed')
        getStatementSchemes.mockRejectedValue(schemeError)
        mockRequest.payload = { schemeId: '1' }

        await failAction(mockRequest, mockH, mockError)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching schemes in validation failure:', schemeError)
        expect(mockH.response).toHaveBeenCalledWith({ error: 'Unable to load schemes. Please try again later.' })
        expect(mockResponse.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
      })
    })

    describe('successful handler execution', () => {
      test('should search statements with all criteria', async () => {
        mockRequest.payload = {
          schemeId: '1',
          marketingYear: '2023',
          frn: '1000000000',
          timestamp: '20230915120000'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: null,
          schemeId: 1,
          marketingYear: 2023,
          frn: 1000000000,
          timestamp: '20230915120000'
        }, 50, null)
      })

      test('should search statements with partial criteria', async () => {
        mockRequest.payload = {
          schemeId: '1',
          marketingYear: '2023'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: null,
          schemeId: 1,
          marketingYear: 2023,
          frn: null,
          timestamp: undefined
        }, 50, null)
      })

      test('should handle custom limit', async () => {
        mockRequest.payload = {
          schemeId: '1',
          limit: '100'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(
          expect.any(Object),
          100,
          null
        )
      })

      test('should use default limit of 50 when not provided', async () => {
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(
          expect.any(Object),
          50,
          null
        )
      })

      test('should handle continuation token', async () => {
        mockRequest.payload = {
          schemeId: '1',
          continuationToken: 'next-token-123'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(
          expect.any(Object),
          50,
          'next-token-123'
        )
      })

      test('should return continuation token from search result', async () => {
        searchStatements.mockResolvedValue({
          statements: mockStatements,
          continuationToken: 'next-page-token'
        })
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          continuationToken: 'next-page-token'
        }))
      })

      test('should log search criteria', async () => {
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(consoleInfoSpy).toHaveBeenCalledWith(
          'Download-statements search criteria: %o',
          {
            filename: null,
            schemeId: 1,
            marketingYear: null,
            frn: null,
            timestamp: undefined
          }
        )
      })

      test('should return view with statements and searchPerformed flag', async () => {
        mockRequest.payload = {
          schemeId: '1',
          marketingYear: '2023'
        }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', {
          schemes: mockSchemes,
          filename: undefined,
          schemeId: '1',
          marketingYear: '2023',
          frn: undefined,
          timestamp: undefined,
          limit: undefined,
          continuationToken: null,
          statements: mockStatements,
          searchPerformed: true
        })
      })

      test('should handle empty statements result', async () => {
        searchStatements.mockResolvedValue({ statements: [], continuationToken: null })
        mockRequest.payload = { schemeId: '999' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          statements: [],
          searchPerformed: true
        }))
      })

      test('should handle search result error property', async () => {
        searchStatements.mockResolvedValue({
          statements: [],
          continuationToken: null,
          error: 'No matching statements found'
        })
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          error: { message: 'No matching statements found' },
          searchPerformed: false
        }))
      })

      test('should handle filename search with no results', async () => {
        searchStatements.mockResolvedValue({ statements: [], continuationToken: null })
        mockRequest.payload = {
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf'
        }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          error: { message: 'Statement not found' },
          searchPerformed: false
        }))
      })

      test('should handle filename search with null statements', async () => {
        searchStatements.mockResolvedValue({ statements: null, continuationToken: null })
        mockRequest.payload = {
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf'
        }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          error: { message: 'Statement not found' },
          searchPerformed: false
        }))
      })
    })

    describe('filename parsing integration', () => {
      test('should parse valid filename and merge with payload', async () => {
        const parsedData = {
          isValid: true,
          schemeId: 1,
          marketingYear: 2024,
          frn: 1000000000,
          timestamp: '20240915120000'
        }

        parseStatementFilename.mockReturnValue(parsedData)
        mockRequest.payload = {
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf'
        }

        await handler(mockRequest, mockH)

        expect(parseStatementFilename).toHaveBeenCalledWith('FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf')
        expect(searchStatements).toHaveBeenCalledWith({
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf',
          schemeId: 1,
          marketingYear: 2024,
          frn: 1000000000,
          timestamp: '20240915120000'
        }, 50, null)
      })

      test('should prefer payload values over parsed filename values', async () => {
        const parsedData = {
          isValid: true,
          schemeId: 1,
          marketingYear: 2024,
          frn: 1000000000,
          timestamp: '20240915120000'
        }

        parseStatementFilename.mockReturnValue(parsedData)
        mockRequest.payload = {
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf',
          schemeId: '2',
          frn: '9999999999'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf',
          schemeId: 2,
          marketingYear: 2024,
          frn: 9999999999,
          timestamp: '20240915120000'
        }, 50, null)
      })

      test('should not merge when filename parsing fails', async () => {
        parseStatementFilename.mockReturnValue({ isValid: false })
        mockRequest.payload = {
          filename: 'invalid-filename.pdf',
          schemeId: '1'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: 'invalid-filename.pdf',
          schemeId: 1,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        }, 50, null)
      })

      test('should handle null parsed result', async () => {
        parseStatementFilename.mockReturnValue(null)
        mockRequest.payload = {
          filename: 'bad-file.pdf'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: 'bad-file.pdf',
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        }, 50, null)
      })

      test('should handle undefined parsed result', async () => {
        parseStatementFilename.mockReturnValue(undefined)
        mockRequest.payload = {
          filename: 'another-bad-file.pdf'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: 'another-bad-file.pdf',
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        }, 50, null)
      })

      test('should handle empty filename in payload', async () => {
        mockRequest.payload = {
          filename: '',
          schemeId: '1'
        }

        await handler(mockRequest, mockH)

        expect(parseStatementFilename).not.toHaveBeenCalled()
        expect(searchStatements).toHaveBeenCalledWith({
          filename: null,
          schemeId: 1,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        }, 50, null)
      })
    })

    describe('error handling', () => {
      test('should handle searchStatements error and return error view', async () => {
        const errorMessage = 'Database connection failed'
        searchStatements.mockRejectedValue(new Error(errorMessage))
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in POST handler:', expect.any(Error))
        expect(mockH.view).toHaveBeenCalledWith('download-statements', {
          schemes: mockSchemes,
          filename: undefined,
          schemeId: '1',
          marketingYear: undefined,
          frn: undefined,
          timestamp: undefined,
          limit: undefined,
          continuationToken: undefined,
          error: { message: errorMessage }
        })
      })

      test('should handle error without message property', async () => {
        searchStatements.mockRejectedValue({ code: 'ERR_NETWORK' })
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          error: { message: 'An error occurred while searching for statements' }
        }))
      })

      test('should handle string error', async () => {
        searchStatements.mockRejectedValue('String error')
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          error: { message: 'An error occurred while searching for statements' }
        }))
      })

      test('should still return schemes when searchStatements fails', async () => {
        searchStatements.mockRejectedValue(new Error('Search failed'))
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(getStatementSchemes).toHaveBeenCalled()
        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          schemes: mockSchemes
        }))
      })

      test('should handle schemes fetch error after search failure', async () => {
        const searchError = new Error('Search failed')
        const schemeError = new Error('Schemes unavailable')

        searchStatements.mockRejectedValue(searchError)
        getStatementSchemes.mockResolvedValueOnce(mockSchemes)
        getStatementSchemes.mockRejectedValueOnce(schemeError)

        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Error in POST handler:', searchError)
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Error fetching schemes after search failure:', schemeError)
        expect(mockH.response).toHaveBeenCalledWith({ error: 'Unable to load schemes. Please try again later.' })
        expect(mockResponse.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
      })
    })

    describe('data type conversion', () => {
      test('should convert string schemeId to number', async () => {
        mockRequest.payload = { schemeId: '123' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          schemeId: 123
        }), 50, null)
      })

      test('should convert string marketingYear to number', async () => {
        mockRequest.payload = { marketingYear: '2024' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          marketingYear: 2024
        }), 50, null)
      })

      test('should convert string frn to number', async () => {
        mockRequest.payload = { frn: '1234567890' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          frn: 1234567890
        }), 50, null)
      })

      test('should handle invalid number conversions', async () => {
        mockRequest.payload = {
          schemeId: 'abc',
          marketingYear: 'xyz',
          frn: 'not-a-number'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          filename: null,
          schemeId: NaN,
          marketingYear: NaN,
          frn: NaN,
          timestamp: undefined
        }, 50, null)
      })

      test('should keep timestamp as string', async () => {
        mockRequest.payload = { timestamp: '20230915120000' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          timestamp: '20230915120000'
        }), 50, null)
      })

      test('should handle floating point limit', async () => {
        mockRequest.payload = { schemeId: '1', limit: '75.9' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.any(Object), 75.9, null)
      })
    })
  })

  describe('GET /download-statements/download/{filename*}', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[2].options.handler
    })

    test('should download statement successfully', async () => {
      mockRequest.params = { filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf' }

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith('FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf')
      expect(mockH.response).toHaveBeenCalledWith('mock-pdf-stream')
      expect(mockResponse.type).toHaveBeenCalledWith('application/pdf')
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000.pdf"'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(SUCCESS)
    })

    test('should handle filename with special characters', async () => {
      const specialFilename = 'FFC_PaymentDelinkedStatement_SFI_2024_1000000000_20240915120000 (1).pdf'
      mockRequest.params = { filename: specialFilename }

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith(specialFilename)
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="${specialFilename}"`
      )
    })

    test('should handle filename with path segments', async () => {
      mockRequest.params = { filename: 'subfolder/statement.pdf' }

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith('subfolder/statement.pdf')
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="subfolder/statement.pdf"'
      )
    })

    test('should handle BlobNotFound error code', async () => {
      const error = new Error('Blob not found')
      error.code = 'BlobNotFound'
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'missing.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(NOT_FOUND)
    })

    test('should handle NOT_FOUND status code', async () => {
      const error = new Error('Statement not found in storage')
      error.statusCode = NOT_FOUND
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'nonexistent.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(NOT_FOUND)
    })

    test('should handle FORBIDDEN status code', async () => {
      const error = new Error('Access denied')
      error.statusCode = FORBIDDEN
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'forbidden.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Access denied' })
      expect(mockResponse.code).toHaveBeenCalledWith(FORBIDDEN)
    })

    test('should handle generic errors with INTERNAL_SERVER_ERROR', async () => {
      const error = new Error('Unexpected error')
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'test.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'An error occurred while downloading the statement' })
      expect(mockResponse.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
    })

    test('should handle network timeout errors', async () => {
      const networkError = new Error('Network timeout')
      networkError.code = 'ETIMEDOUT'
      downloadStatement.mockRejectedValue(networkError)
      mockRequest.params = { filename: 'statement.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', networkError)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'An error occurred while downloading the statement' })
      expect(mockResponse.code).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR)
    })

    test('should handle empty filename parameter', async () => {
      mockRequest.params = { filename: '' }

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith('')
    })

    test('should handle undefined filename parameter', async () => {
      mockRequest.params = {}

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith(undefined)
    })

    test('should not log error on successful download', async () => {
      mockRequest.params = { filename: 'success.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    test('should handle full workflow: GET -> POST with search -> download', async () => {
      const getHandler = downloadStatementsRoute[0].options.handler
      const postHandler = downloadStatementsRoute[1].options.handler
      const downloadHandler = downloadStatementsRoute[2].options.handler

      await getHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        schemes: mockSchemes
      }))

      mockRequest.payload = { schemeId: '1', marketingYear: '2024' }
      await postHandler(mockRequest, mockH)
      expect(searchStatements).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        statements: mockStatements,
        searchPerformed: true
      }))

      mockRequest.params = { filename: mockStatements[0].filename }
      await downloadHandler(mockRequest, mockH)
      expect(downloadStatement).toHaveBeenCalledWith(mockStatements[0].filename)
      expect(mockResponse.code).toHaveBeenCalledWith(SUCCESS)
    })

    test('should preserve user input in view after search', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        filename: 'test-file.pdf',
        schemeId: '2',
        marketingYear: '2024',
        frn: '1234567890',
        timestamp: '20240101120000'
      }

      await postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('download-statements', {
        schemes: mockSchemes,
        filename: 'test-file.pdf',
        schemeId: '2',
        marketingYear: '2024',
        frn: '1234567890',
        timestamp: '20240101120000',
        limit: undefined,
        continuationToken: null,
        statements: mockStatements,
        searchPerformed: true
      })
    })

    test('should preserve user input in view after error', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      searchStatements.mockRejectedValue(new Error('Service error'))
      mockRequest.payload = {
        schemeId: '1',
        marketingYear: '2023'
      }

      await postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        schemeId: '1',
        marketingYear: '2023',
        error: { message: 'Service error' }
      }))
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('should handle very large FRN values', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = { frn: '9999999999' }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
        frn: 9999999999
      }), 50, null)
    })

    test('should handle zero values', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        schemeId: '0',
        marketingYear: '0',
        frn: '0'
      }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith({
        filename: null,
        schemeId: 0,
        marketingYear: 0,
        frn: 0,
        timestamp: undefined
      }, 50, null)
    })

    test('should handle negative values', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        schemeId: '-1',
        marketingYear: '-2023'
      }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
        schemeId: -1,
        marketingYear: -2023
      }), 50, null)
    })

    test('should handle whitespace in string values', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        schemeId: '  1  ',
        timestamp: '  20230915120000  '
      }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith({
        filename: null,
        schemeId: 1,
        marketingYear: null,
        frn: null,
        timestamp: '  20230915120000  '
      }, 50, null)
    })

    test('should handle null values in payload', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        schemeId: null,
        marketingYear: null,
        frn: null
      }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith({
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        timestamp: undefined
      }, 50, null)
    })
  })
})
