const { filenameSearch } = require('../../../app/statement-downloader/search-helpers/filename-search')
const { getStatementsContainer, parseFilename } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')
const { createStatementResult, createStatementResultFromDBRow } = require('../../../app/statement-downloader/search-helpers/create-statement')
const db = require('../../../app/statement-downloader/statement-db-search')
const { NOT_FOUND } = require('../../../app/constants/http-status-codes')

jest.mock('../../../app/statement-downloader/search-helpers/get-statement-parts')
jest.mock('../../../app/statement-downloader/search-helpers/create-statement')
jest.mock('../../../app/statement-downloader/statement-db-search')

describe('filename-search', () => {
  let mockBlobClient
  let mockStatementsContainer

  beforeEach(() => {
    jest.clearAllMocks()

    mockBlobClient = {
      getProperties: jest.fn()
    }

    mockStatementsContainer = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient)
    }

    getStatementsContainer.mockResolvedValue(mockStatementsContainer)
  })

  describe('filenameSearch', () => {
    describe('basic functionality', () => {
      test('should search blob by filename and return parsed result', async () => {
        const mockProps = { contentLength: 1024, lastModified: new Date() }
        const mockParsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }
        const mockStatement = { filename: 'statement.pdf', scheme: 'SFI', size: 1024 }

        mockBlobClient.getProperties.mockResolvedValue(mockProps)
        parseFilename.mockReturnValue(mockParsed)
        createStatementResult.mockReturnValue(mockStatement)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result).toEqual({
          statements: [mockStatement],
          continuationToken: null
        })
      })

      test('should return null when criteria is empty object', async () => {
        const result = await filenameSearch({})

        expect(result).toBeNull()
      })

      test('should return null when criteria is null', async () => {
        const result = await filenameSearch(null)

        expect(result).toBeNull()
      })

      test('should return null when criteria is undefined', async () => {
        const result = await filenameSearch(undefined)

        expect(result).toBeNull()
      })

      test('should return null when filename is null', async () => {
        const result = await filenameSearch({ filename: null })

        expect(result).toBeNull()
      })

      test('should return null when filename is undefined', async () => {
        const result = await filenameSearch({ filename: undefined })

        expect(result).toBeNull()
      })

      test('should return null when filename is empty string', async () => {
        const result = await filenameSearch({ filename: '' })

        expect(result).toBeNull()
      })
    })

    describe('blob path construction', () => {
      test('should add outbound prefix when filename has no slash', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)
        createStatementResult.mockReturnValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/statement.pdf')
      })

      test('should not add outbound prefix when filename already has slash', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'outbound/statement.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/statement.pdf')
      })

      test('should preserve full path with multiple slashes', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'outbound/2024/09/statement.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/2024/09/statement.pdf')
      })
    })

    describe('blob search flow', () => {
      test('should get statements container', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(getStatementsContainer).toHaveBeenCalled()
      })

      test('should get blob client for constructed path', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
          'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'
        )
      })

      test('should get blob properties', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(mockBlobClient.getProperties).toHaveBeenCalled()
      })

      test('should parse filename from blob path', async () => {
        const blobPath = 'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf' })

        expect(parseFilename).toHaveBeenCalledWith(blobPath)
      })
    })

    describe('parsed filename result', () => {
      test('should create statement result when parseFilename succeeds', async () => {
        const mockProps = { contentLength: 2048, lastModified: new Date('2024-09-15') }
        const mockParsed = { scheme: 'BPS', year: '2024', frn: '9999999999', timestamp: '20240915120000' }
        const mockStatement = { filename: 'statement.pdf', scheme: 'BPS', size: 2048 }

        mockBlobClient.getProperties.mockResolvedValue(mockProps)
        parseFilename.mockReturnValue(mockParsed)
        createStatementResult.mockReturnValue(mockStatement)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(createStatementResult).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'outbound/statement.pdf', properties: mockProps }),
          mockParsed
        )
        expect(result.statements).toEqual([mockStatement])
      })

      test('should return null continuation token when parsed', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue({ scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' })
        createStatementResult.mockReturnValue({ filename: 'statement.pdf', scheme: 'SFI' })

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.continuationToken).toBeNull()
      })
    })

    describe('basic statement result fallback', () => {
      test('should create basic result when parseFilename returns null', async () => {
        const mockProps = { contentLength: 512, lastModified: new Date('2024-09-15') }

        mockBlobClient.getProperties.mockResolvedValue(mockProps)
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'invalid.pdf' })

        expect(result).toEqual({
          statements: [{
            filename: 'invalid.pdf',
            size: 512,
            lastModified: new Date('2024-09-15')
          }],
          continuationToken: null
        })
      })

      test('should handle missing contentLength in basic result', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.statements[0].size).toBeNull()
      })

      test('should handle missing lastModified in basic result', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024 })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.statements[0].lastModified).toBeNull()
      })

      test('should handle both missing properties in basic result', async () => {
        mockBlobClient.getProperties.mockResolvedValue({})
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.statements[0].size).toBeNull()
        expect(result.statements[0].lastModified).toBeNull()
      })
    })

    describe('blob not found error handling', () => {
      test('should fallback to DB search on 404 status code', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        const mockRow = { filename: 'statement.pdf', received: new Date() }
        const mockStatement = { filename: 'statement.pdf', scheme: 'SFI' }

        db.getByFilename.mockResolvedValue(mockRow)
        createStatementResultFromDBRow.mockReturnValue(mockStatement)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result).toEqual({
          statements: [mockStatement],
          continuationToken: null
        })
      })

      test('should fallback to DB search on BlobNotFound code', async () => {
        const error = new Error('Blob not found')
        error.code = 'BlobNotFound'
        mockBlobClient.getProperties.mockRejectedValue(error)

        const mockRow = { filename: 'statement.pdf', received: new Date() }
        const mockStatement = { filename: 'statement.pdf', scheme: 'SFI' }

        db.getByFilename.mockResolvedValue(mockRow)
        createStatementResultFromDBRow.mockReturnValue(mockStatement)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(db.getByFilename).toHaveBeenCalledWith('statement.pdf')
        expect(result.statements).toEqual([mockStatement])
      })

      test('should call DB search with original filename on blob not found', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)

        await filenameSearch({ filename: 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf' })

        expect(db.getByFilename).toHaveBeenCalledWith('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')
      })

      test('should return empty statements when DB search returns null', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)
        createStatementResultFromDBRow.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result).toEqual({
          statements: [],
          continuationToken: null
        })
      })
    })

    describe('DB search errors', () => {
      test('should catch and warn on DB search error', async () => {
        const blobError = new Error('Not found')
        blobError.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(blobError)

        const dbError = new Error('Database connection failed')
        db.getByFilename.mockRejectedValue(dbError)

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(consoleWarnSpy).toHaveBeenCalledWith('DB filename search failed:', 'Database connection failed')
        expect(result).toEqual({
          statements: [],
          continuationToken: null
        })

        consoleWarnSpy.mockRestore()
      })

      test('should log error message when DB search throws', async () => {
        const blobError = new Error('Not found')
        blobError.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(blobError)

        const dbError = new Error('Query timeout')
        db.getByFilename.mockRejectedValue(dbError)

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        await filenameSearch({ filename: 'statement.pdf' })

        expect(consoleWarnSpy).toHaveBeenCalledWith('DB filename search failed:', 'Query timeout')

        consoleWarnSpy.mockRestore()
      })

      test('should log error object when message is unavailable', async () => {
        const blobError = new Error('Not found')
        blobError.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(blobError)

        const dbError = { code: 'TIMEOUT' }
        db.getByFilename.mockRejectedValue(dbError)

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        await filenameSearch({ filename: 'statement.pdf' })

        expect(consoleWarnSpy).toHaveBeenCalledWith('DB filename search failed:', dbError)

        consoleWarnSpy.mockRestore()
      })

      test('should return empty statements after DB error', async () => {
        const blobError = new Error('Not found')
        blobError.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(blobError)

        db.getByFilename.mockRejectedValue(new Error('DB error'))

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result).toEqual({
          statements: [],
          continuationToken: null
        })
      })
    })

    describe('non-404 blob errors', () => {
      test('should re-throw non-404 blob errors', async () => {
        const error = new Error('Access denied')
        error.statusCode = 403
        mockBlobClient.getProperties.mockRejectedValue(error)

        await expect(filenameSearch({ filename: 'statement.pdf' })).rejects.toThrow('Access denied')
      })

      test('should re-throw blob errors with different status code', async () => {
        const error = new Error('Server error')
        error.status = 500
        mockBlobClient.getProperties.mockRejectedValue(error)

        await expect(filenameSearch({ filename: 'statement.pdf' })).rejects.toThrow('Server error')
      })

      test('should re-throw blob errors with no status code', async () => {
        const error = new Error('Unknown error')
        mockBlobClient.getProperties.mockRejectedValue(error)

        await expect(filenameSearch({ filename: 'statement.pdf' })).rejects.toThrow('Unknown error')
      })

      test('should re-throw blob errors with statusCode property', async () => {
        const error = new Error('Container error')
        error.statusCode = 500
        mockBlobClient.getProperties.mockRejectedValue(error)

        await expect(filenameSearch({ filename: 'statement.pdf' })).rejects.toThrow('Container error')
      })

      test('should not attempt DB fallback on 403 error', async () => {
        const error = new Error('Forbidden')
        error.statusCode = 403
        mockBlobClient.getProperties.mockRejectedValue(error)

        try {
          await filenameSearch({ filename: 'statement.pdf' })
        } catch (e) {
          // Error thrown as expected
        }

        expect(db.getByFilename).not.toHaveBeenCalled()
      })
    })

    describe('error detection', () => {
      test('should detect 404 with statusCode property', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(db.getByFilename).toHaveBeenCalled()
      })

      test('should detect 404 with status property', async () => {
        const error = new Error('Not found')
        error.status = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(db.getByFilename).toHaveBeenCalled()
      })

      test('should detect BlobNotFound code', async () => {
        const error = new Error('Blob not found')
        error.code = 'BlobNotFound'
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(db.getByFilename).toHaveBeenCalled()
      })

      test('should prefer statusCode over status', async () => {
        const error = new Error('Error')
        error.statusCode = NOT_FOUND
        error.status = 500
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)

        await filenameSearch({ filename: 'statement.pdf' })

        expect(db.getByFilename).toHaveBeenCalled()
      })
    })

    describe('result structure', () => {
      test('should return object with statements and continuationToken', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result).toHaveProperty('statements')
        expect(result).toHaveProperty('continuationToken')
        expect(Object.keys(result)).toHaveLength(2)
      })

      test('should return array for statements', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(Array.isArray(result.statements)).toBe(true)
      })

      test('should return single statement in array', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.statements).toHaveLength(1)
      })

      test('should return null for continuationToken', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.continuationToken).toBeNull()
      })
    })

    describe('edge cases', () => {
      test('should handle filename with special characters', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'FFC-Statement_2024.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/FFC-Statement_2024.pdf')
      })

      test('should handle filename with multiple occurrences of slash', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'archive/old/statement.pdf' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('archive/old/statement.pdf')
      })

      test('should handle criteria with extra properties', async () => {
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: 'statement.pdf', extraProperty: 'ignored' })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/statement.pdf')
      })

      test('should handle very long filename', async () => {
        const longFilename = 'FFC_' + 'A'.repeat(500) + '.pdf'
        mockBlobClient.getProperties.mockResolvedValue({ contentLength: 1024, lastModified: new Date() })
        parseFilename.mockReturnValue(null)

        await filenameSearch({ filename: longFilename })

        expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(`outbound/${longFilename}`)
      })
    })

    describe('integration scenarios', () => {
      test('should handle successful blob search with parsed result', async () => {
        const mockProps = { contentLength: 5120, lastModified: new Date('2024-09-15') }
        const mockParsed = { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '20240915120000' }
        const mockStatement = {
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000.pdf',
          scheme: 'SFI',
          year: '2024',
          frn: '1100021264',
          timestamp: '20240915120000',
          size: 5120,
          lastModified: new Date('2024-09-15')
        }

        mockBlobClient.getProperties.mockResolvedValue(mockProps)
        parseFilename.mockReturnValue(mockParsed)
        createStatementResult.mockReturnValue(mockStatement)

        const result = await filenameSearch({
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000.pdf'
        })

        expect(result.statements).toEqual([mockStatement])
        expect(result.continuationToken).toBeNull()
      })

      test('should handle blob not found and fallback to DB with result', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        const mockRow = {
          filename: 'statement.pdf',
          schemeshortname: 'BPS',
          schemeyear: 2024,
          frn: 9999999999,
          received: new Date('2024-09-15')
        }
        const mockStatement = {
          filename: 'statement.pdf',
          scheme: 'BPS',
          year: '2024',
          frn: '9999999999',
          size: null,
          lastModified: new Date('2024-09-15')
        }

        db.getByFilename.mockResolvedValue(mockRow)
        createStatementResultFromDBRow.mockReturnValue(mockStatement)

        const result = await filenameSearch({ filename: 'statement.pdf' })

        expect(result.statements).toEqual([mockStatement])
        expect(result.continuationToken).toBeNull()
      })

      test('should handle blob not found and DB also returns nothing', async () => {
        const error = new Error('Not found')
        error.statusCode = NOT_FOUND
        mockBlobClient.getProperties.mockRejectedValue(error)

        db.getByFilename.mockResolvedValue(null)
        createStatementResultFromDBRow.mockReturnValue(null)

        const result = await filenameSearch({ filename: 'nonexistent.pdf' })

        expect(result).toEqual({
          statements: [],
          continuationToken: null
        })
      })
    })
  })
})
