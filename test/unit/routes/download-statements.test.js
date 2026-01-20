const downloadStatementsRoute = require('../../../app/routes/download-statements')
const { searchStatements, downloadStatement } = require('../../../app/storage/statement-search')
const { parseStatementFilename } = require('../../../app/helpers/parse-statement-filename')
const { getStatementSchemes } = require('../../../app/helpers/get-statement-schemes')
const { BAD_REQUEST, SUCCESS, NOT_FOUND } = require('../../../app/constants/http-status-codes')
const { applicationAdmin } = require('../../../app/auth/permissions')

jest.mock('../../../app/storage/statement-search')
jest.mock('../../../app/helpers/parse-statement-filename')
jest.mock('../../../app/helpers/get-statement-schemes')

describe('download-statements route', () => {
  let mockRequest
  let mockH
  let mockResponse
  let consoleErrorSpy

  const mockSchemes = [
    { schemeId: 1, schemeName: 'SFI' },
    { schemeId: 2, schemeName: 'BPS' }
  ]

  const mockStatements = [
    {
      filename: 'FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf',
      schemeId: 1,
      marketingYear: 2023,
      frn: 1000000000,
      timestamp: '20230915120000'
    },
    {
      filename: 'S1234568-2023-1000000001-20230916120000.pdf',
      schemeId: 2,
      marketingYear: 2023,
      frn: 1000000001,
      timestamp: '20230916120000'
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

    getStatementSchemes.mockResolvedValue(mockSchemes)
    parseStatementFilename.mockReturnValue({ isValid: false })
    searchStatements.mockResolvedValue(mockStatements)
    downloadStatement.mockResolvedValue(mockReadableStream)
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

    test('should propagate error if getStatementSchemes fails', async () => {
      const error = new Error('Failed to fetch schemes')
      getStatementSchemes.mockRejectedValue(error)

      await expect(handler(mockRequest, mockH)).rejects.toThrow('Failed to fetch schemes')
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
          error: mockError
        })
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
          schemeId: 1,
          marketingYear: 2023,
          frn: 1000000000,
          timestamp: '20230915120000'
        })
      })

      test('should search statements with partial criteria', async () => {
        mockRequest.payload = {
          schemeId: '1',
          marketingYear: '2023'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: 1,
          marketingYear: 2023,
          frn: null,
          timestamp: undefined
        })
      })

      test('should search with null criteria when no payload provided', async () => {
        mockRequest.payload = {}

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        })
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
          statements: mockStatements,
          searchPerformed: true
        })
      })

      test('should handle empty statements result', async () => {
        searchStatements.mockResolvedValue([])
        mockRequest.payload = { schemeId: '999' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
          statements: [],
          searchPerformed: true
        }))
      })
    })

    describe('filename parsing integration', () => {
      test('should parse valid filename and merge with payload', async () => {
        const parsedData = {
          isValid: true,
          schemeId: 1,
          marketingYear: 2023,
          frn: 1000000000,
          timestamp: '20230915120000'
        }

        parseStatementFilename.mockReturnValue(parsedData)
        mockRequest.payload = {
          filename: 'FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf'
        }

        await handler(mockRequest, mockH)

        expect(parseStatementFilename).toHaveBeenCalledWith('FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf')
        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: 1,
          marketingYear: 2023,
          frn: 1000000000,
          timestamp: '20230915120000'
        })
      })

      test('should prefer payload values over parsed filename values', async () => {
        const parsedData = {
          isValid: true,
          schemeId: 1,
          marketingYear: 2023,
          frn: 1000000000,
          timestamp: '20230915120000'
        }

        parseStatementFilename.mockReturnValue(parsedData)
        mockRequest.payload = {
          filename: 'FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf',
          schemeId: '2',
          frn: '9999999999'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: 2,
          marketingYear: 2023,
          frn: 9999999999,
          timestamp: '20230915120000'
        })
      })

      test('should not merge when filename parsing fails', async () => {
        parseStatementFilename.mockReturnValue({ isValid: false })
        mockRequest.payload = {
          filename: 'invalid-filename.pdf',
          schemeId: '1'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: 1,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        })
      })

      test('should handle null parsed result', async () => {
        parseStatementFilename.mockReturnValue(null)
        mockRequest.payload = {
          filename: 'bad-file.pdf'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        })
      })

      test('should handle undefined parsed result', async () => {
        parseStatementFilename.mockReturnValue(undefined)
        mockRequest.payload = {
          filename: 'another-bad-file.pdf'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        })
      })

      test('should handle empty filename in payload', async () => {
        mockRequest.payload = {
          filename: '',
          schemeId: '1'
        }

        await handler(mockRequest, mockH)

        expect(parseStatementFilename).not.toHaveBeenCalled()
        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: 1,
          marketingYear: null,
          frn: null,
          timestamp: undefined
        })
      })
    })

    describe('error handling', () => {
      test('should handle searchStatements error and return error view', async () => {
        const errorMessage = 'Database connection failed'
        searchStatements.mockRejectedValue(new Error(errorMessage))
        mockRequest.payload = { schemeId: '1' }

        await handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith('download-statements', {
          schemes: mockSchemes,
          filename: undefined,
          schemeId: '1',
          marketingYear: undefined,
          frn: undefined,
          timestamp: undefined,
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
    })

    describe('data type conversion', () => {
      test('should convert string schemeId to number', async () => {
        mockRequest.payload = { schemeId: '123' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          schemeId: 123
        }))
      })

      test('should convert string marketingYear to number', async () => {
        mockRequest.payload = { marketingYear: '2024' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          marketingYear: 2024
        }))
      })

      test('should convert string frn to number', async () => {
        mockRequest.payload = { frn: '1234567890' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          frn: 1234567890
        }))
      })

      test('should handle invalid number conversions', async () => {
        mockRequest.payload = {
          schemeId: 'abc',
          marketingYear: 'xyz',
          frn: 'not-a-number'
        }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith({
          schemeId: Number.NaN,
          marketingYear: Number.NaN,
          frn: Number.NaN,
          timestamp: undefined
        })
      })

      test('should keep timestamp as string', async () => {
        mockRequest.payload = { timestamp: '20230915120000' }

        await handler(mockRequest, mockH)

        expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
          timestamp: '20230915120000'
        }))
      })
    })
  })

  describe('GET /download-statements/download/{filename*}', () => {
    let handler

    beforeEach(() => {
      handler = downloadStatementsRoute[2].options.handler
    })

    test('should download statement successfully', async () => {
      mockRequest.params = { filename: 'FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf' }

      await handler(mockRequest, mockH)

      expect(downloadStatement).toHaveBeenCalledWith('FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf')
      expect(mockH.response).toHaveBeenCalledWith('mock-pdf-stream')
      expect(mockResponse.type).toHaveBeenCalledWith('application/pdf')
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="FFC_someSFI_statement_SFI_2025_1000000000_20250915120000.pdf"'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(SUCCESS)
    })

    test('should handle filename with special characters', async () => {
      const specialFilename = 'FFC_someSFI_statement_SFI_2025_1000000000_20250915120000 (1).pdf'
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

    test('should log error and return NOT_FOUND when download fails', async () => {
      const error = new Error('Statement not found in storage')
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'nonexistent.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(NOT_FOUND)
    })

    test('should log error with full error object when download fails', async () => {
      const error = new Error('Blob not found')
      error.statusCode = 404
      error.code = 'BlobNotFound'
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'missing.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    test('should handle network errors during download', async () => {
      const networkError = new Error('Network timeout')
      networkError.code = 'ETIMEDOUT'
      downloadStatement.mockRejectedValue(networkError)
      mockRequest.params = { filename: 'statement.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', networkError)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(NOT_FOUND)
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

    test('should return error response on exception', async () => {
      downloadStatement.mockRejectedValue(new Error('Storage unavailable'))
      mockRequest.params = { filename: 'test.pdf' }

      const result = await handler(mockRequest, mockH)

      expect(result).toBe(mockResponse)
      expect(mockH.response).toHaveBeenCalledWith({ error: 'Statement not found' })
      expect(mockResponse.code).toHaveBeenCalledWith(NOT_FOUND)
    })

    test('should log error message when error object has message', async () => {
      const error = { message: 'Custom error message' }
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'test.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
    })

    test('should log error even when error is null', async () => {
      downloadStatement.mockRejectedValue(null)
      mockRequest.params = { filename: 'test.pdf' }

      await handler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', null)
    })
  })

  describe('integration scenarios', () => {
    test('should handle full workflow: GET -> POST with search -> download', async () => {
      const getHandler = downloadStatementsRoute[0].options.handler
      const postHandler = downloadStatementsRoute[1].options.handler
      const downloadHandler = downloadStatementsRoute[2].options.handler

      // Step 1: GET request
      await getHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        schemes: mockSchemes
      }))

      // Step 2: POST request with search
      mockRequest.payload = { schemeId: '1', marketingYear: '2023' }
      await postHandler(mockRequest, mockH)
      expect(searchStatements).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        statements: mockStatements,
        searchPerformed: true
      }))

      // Step 3: Download a statement
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
      }))
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
        schemeId: 0,
        marketingYear: 0,
        frn: 0,
        timestamp: undefined
      })
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
      }))
    })

    test('should handle floating point numbers in string format', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = { schemeId: '1.5' }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith(expect.objectContaining({
        schemeId: 1
      }))
    })

    test('should handle whitespace in string values', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = {
        schemeId: '  1  ',
        timestamp: '  20230915120000  '
      }

      await postHandler(mockRequest, mockH)

      expect(searchStatements).toHaveBeenCalledWith({
        schemeId: 1,
        marketingYear: null,
        frn: null,
        timestamp: '  20230915120000  '
      })
    })

    test('should handle undefined crumb value', async () => {
      const getHandler = downloadStatementsRoute[0].options.handler
      mockRequest.plugins.crumb = undefined

      await getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('download-statements', expect.objectContaining({
        crumb: undefined
      }))
    })

    test('should handle missing plugins object', async () => {
      const getHandler = downloadStatementsRoute[0].options.handler
      mockRequest.plugins = undefined

      await expect(async () => {
        await getHandler(mockRequest, mockH)
      }).rejects.toThrow()
    })
  })

  describe('console.error logging verification', () => {
    test('should log to console.error exactly once on download error', async () => {
      const downloadHandler = downloadStatementsRoute[2].options.handler
      const error = new Error('Test error')
      downloadStatement.mockRejectedValue(error)
      mockRequest.params = { filename: 'test.pdf' }

      await downloadHandler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', error)
    })

    test('should log exact error message text', async () => {
      const downloadHandler = downloadStatementsRoute[2].options.handler
      const specificError = new Error('Specific error message for testing')
      downloadStatement.mockRejectedValue(specificError)
      mockRequest.params = { filename: 'test.pdf' }

      await downloadHandler(mockRequest, mockH)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Download error:', specificError)
      const loggedError = consoleErrorSpy.mock.calls[0][1]
      expect(loggedError.message).toBe('Specific error message for testing')
    })

    test('should not log errors when downloads succeed', async () => {
      const downloadHandler = downloadStatementsRoute[2].options.handler
      mockRequest.params = { filename: 'success.pdf' }

      await downloadHandler(mockRequest, mockH)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    test('should not log errors during successful POST requests', async () => {
      const postHandler = downloadStatementsRoute[1].options.handler
      mockRequest.payload = { schemeId: '1' }

      await postHandler(mockRequest, mockH)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})
