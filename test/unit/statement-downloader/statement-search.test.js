const { searchStatements, downloadStatement } = require('../../../app/statement-downloader/statement-search')
const { filenameSearch } = require('../../../app/statement-downloader/search-helpers/filename-search')
const { constructedFilenameSearch } = require('../../../app/statement-downloader/search-helpers/constructed-filename-search')
const { dbSearch } = require('../../../app/statement-downloader/search-helpers/db-search')
const { apiBlobSearch } = require('../../../app/statement-downloader/search-helpers/api-blob-search')
const { downloadStatement: downloadStatementHelper } = require('../../../app/statement-downloader/search-helpers/download-statement')

jest.mock('../../../app/statement-downloader/search-helpers/filename-search')
jest.mock('../../../app/statement-downloader/search-helpers/constructed-filename-search')
jest.mock('../../../app/statement-downloader/search-helpers/db-search')
jest.mock('../../../app/statement-downloader/search-helpers/api-blob-search')
jest.mock('../../../app/statement-downloader/search-helpers/download-statement')

describe('statement-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchStatements', () => {
    const createMockStatement = (filename, scheme = 'SFI', year = '2024', frn = '1100021264', timestamp = '2025081908254124') => ({
      filename,
      scheme,
      year,
      frn,
      timestamp,
      size: 1024,
      lastModified: new Date('2025-01-15')
    })

    describe('validation', () => {
      test('should return error when criteria is empty object', async () => {
        const result = await searchStatements({})

        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
      })

      test('should return error when criteria is undefined', async () => {
        const result = await searchStatements(undefined)

        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
      })

      test('should return error when criteria is null', async () => {
        const result = await searchStatements(null)

        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
      })

      test('should return error when criteria has only falsy values', async () => {
        const result = await searchStatements({ schemeId: 0, marketingYear: null })

        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
      })
    })

    describe('search strategy waterfall', () => {
      test('should use filename search when filename provided', async () => {
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        filenameSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ filename: 'test.pdf' })

        expect(filenameSearch).toHaveBeenCalledWith({ filename: 'test.pdf' })
        expect(constructedFilenameSearch).not.toHaveBeenCalled()
        expect(dbSearch).not.toHaveBeenCalled()
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })

      test('should use constructed filename search when all required criteria provided', async () => {
        filenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('constructed.pdf')],
          continuationToken: null
        }
        constructedFilenameSearch.mockResolvedValue(mockResult)

        const criteria = { schemeId: 1, marketingYear: 2024, frn: '1100021264', timestamp: '2025081908254124' }
        const result = await searchStatements(criteria)

        expect(filenameSearch).toHaveBeenCalled()
        expect(constructedFilenameSearch).toHaveBeenCalledWith(criteria)
        expect(dbSearch).not.toHaveBeenCalled()
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })

      test('should use db search when previous strategies return null', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('db-result.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1 })

        expect(filenameSearch).toHaveBeenCalled()
        expect(constructedFilenameSearch).toHaveBeenCalled()
        expect(dbSearch).toHaveBeenCalledWith(50, 0, { schemeId: 1 })
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })

      test('should use apiBlobSearch when all previous strategies fail', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        const mockResult = {
          statements: [createMockStatement('api-result.pdf')],
          continuationToken: null
        }
        apiBlobSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1 })

        expect(filenameSearch).toHaveBeenCalled()
        expect(constructedFilenameSearch).toHaveBeenCalled()
        expect(dbSearch).toHaveBeenCalled()
        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, { schemeId: 1 })
        expect(result).toEqual(mockResult)
      })

      test('should return empty statements when all strategies return null or empty', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        const result = await searchStatements({ schemeId: 1 })

        expect(result.statements).toEqual([])
        expect(result.continuationToken).toBeNull()
      })

      test('should skip to next strategy when filename search returns empty array', async () => {
        filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })
        constructedFilenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('db-result.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ filename: 'nonexistent.pdf', schemeId: 1 })

        expect(result).toEqual({ statements: [], continuationToken: null })
      })

      test('should handle db search failure and fall back to apiBlobSearch', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockRejectedValue(new Error('DB connection failed'))
        const mockResult = {
          statements: [createMockStatement('api-result.pdf')],
          continuationToken: null
        }
        apiBlobSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1 })

        expect(apiBlobSearch).toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })
    })

    describe('criteria handling', () => {
      test('should pass schemeId to strategies', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1 })

        expect(dbSearch).toHaveBeenCalledWith(50, 0, { schemeId: 1 })
        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, { schemeId: 1 })
      })

      test('should pass marketingYear to strategies', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ marketingYear: 2025 })

        expect(dbSearch).toHaveBeenCalledWith(50, 0, { marketingYear: 2025 })
        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, { marketingYear: 2025 })
      })

      test('should pass frn to strategies', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ frn: '1234567890' })

        expect(dbSearch).toHaveBeenCalledWith(50, 0, { frn: '1234567890' })
        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, { frn: '1234567890' })
      })

      test('should pass timestamp to strategies', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1, timestamp: '2025081908254124' })

        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, { schemeId: 1, timestamp: '2025081908254124' })
      })

      test('should pass all criteria to strategies', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        const criteria = {
          schemeId: 1,
          marketingYear: 2024,
          frn: '1100021264',
          timestamp: '2025081908254124'
        }
        await searchStatements(criteria)

        expect(constructedFilenameSearch).toHaveBeenCalledWith(criteria)
        expect(dbSearch).toHaveBeenCalledWith(50, 0, criteria)
        expect(apiBlobSearch).toHaveBeenCalledWith(50, null, criteria)
      })
    })

    describe('pagination', () => {
      test('should handle custom limit', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1 }, 100)

        expect(dbSearch).toHaveBeenCalledWith(100, 0, { schemeId: 1 })
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { schemeId: 1 })
      })

      test('should handle continuation token', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1 }, 50, 'next-token')

        expect(apiBlobSearch).toHaveBeenCalledWith(50, 'next-token', { schemeId: 1 })
      })

      test('should return continuation token from apiBlobSearch', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: 'next-page-token'
        }
        apiBlobSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1 })

        expect(result.continuationToken).toBe('next-page-token')
      })

      test('should handle invalid continuation token as 0', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1 }, 50, 'invalid-token')

        expect(apiBlobSearch).toHaveBeenCalledWith(50, 'invalid-token', { schemeId: 1 })
      })
    })

    describe('edge cases', () => {
      test('should handle null marketingYear', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1, marketingYear: null })

        expect(result.statements).toHaveLength(1)
      })

      test('should handle null frn', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1, frn: null })

        expect(result.statements).toHaveLength(1)
      })

      test('should preserve all statement properties', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        const statement = createMockStatement('test.pdf')
        dbSearch.mockResolvedValue({ statements: [statement], continuationToken: null })

        const result = await searchStatements({ schemeId: 1 })

        expect(result.statements[0]).toEqual(statement)
      })
    })
  })

  describe('downloadStatement', () => {
    test('should call downloadStatementHelper with filename', async () => {
      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const result = await downloadStatement('test-file.pdf')

      expect(downloadStatementHelper).toHaveBeenCalledWith('test-file.pdf')
      expect(result).toEqual(mockDownloadResult)
    })

    test('should handle filename with path', async () => {
      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const result = await downloadStatement('outbound/test-file.pdf')

      expect(downloadStatementHelper).toHaveBeenCalledWith('outbound/test-file.pdf')
      expect(result).toEqual(mockDownloadResult)
    })

    test('should handle special characters in filename', async () => {
      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const result = await downloadStatement('file with spaces (1).pdf')

      expect(downloadStatementHelper).toHaveBeenCalledWith('file with spaces (1).pdf')
      expect(result).toEqual(mockDownloadResult)
    })

    test('should handle empty filename', async () => {
      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const result = await downloadStatement('')

      expect(downloadStatementHelper).toHaveBeenCalledWith('')
      expect(result).toEqual(mockDownloadResult)
    })

    test('should propagate errors from downloadStatementHelper', async () => {
      downloadStatementHelper.mockRejectedValue(new Error('Download failed'))

      await expect(downloadStatement('test.pdf')).rejects.toThrow('Download failed')
    })
  })

  describe('integration scenarios', () => {
    test('should search and then download a specific statement', async () => {
      const statement = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '2025081908254124',
        size: 1024,
        lastModified: new Date('2025-01-15')
      }

      filenameSearch.mockResolvedValue(null)
      constructedFilenameSearch.mockResolvedValue(null)
      dbSearch.mockResolvedValue({
        statements: [statement],
        continuationToken: null
      })

      const searchResults = await searchStatements({ schemeId: 1 })
      expect(searchResults.statements).toHaveLength(1)

      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const downloadResult = await downloadStatement(searchResults.statements[0].filename)
      expect(downloadResult).toEqual(mockDownloadResult)
    })

    test('should handle workflow with no matching results', async () => {
      filenameSearch.mockResolvedValue(null)
      constructedFilenameSearch.mockResolvedValue(null)
      dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
      apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

      const searchResults = await searchStatements({ schemeId: 1 })
      expect(searchResults.statements).toEqual([])
    })

    test('should handle workflow with constructed filename match', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue(null)
      constructedFilenameSearch.mockResolvedValue({
        statements: [{
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
          scheme: 'SFI',
          year: '2024',
          frn: '1100021264',
          timestamp: '2025081908254124',
          size: 1024,
          lastModified: new Date('2025-01-15')
        }],
        continuationToken: null
      })

      const result = await searchStatements(criteria)
      expect(result.statements).toHaveLength(1)
      expect(dbSearch).not.toHaveBeenCalled()
      expect(apiBlobSearch).not.toHaveBeenCalled()
    })
  })
})
