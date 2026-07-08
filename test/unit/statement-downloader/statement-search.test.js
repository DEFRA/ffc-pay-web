const { searchStatements, downloadStatement } = require('../../../app/statement-downloader/statement-search')
const { filenameSearch } = require('../../../app/statement-downloader/search-helpers/filename-search')
const { constructedFilenameSearch } = require('../../../app/statement-downloader/search-helpers/constructed-filename-search')
const { dbSearch } = require('../../../app/statement-downloader/search-helpers/db-search')
const { apiBlobSearch } = require('../../../app/statement-downloader/search-helpers/api-blob-search')
const { downloadStatement: downloadStatementHelper } = require('../../../app/statement-downloader/search-helpers/download-statement')
const { sendRequestsLog } = require('../../../app/statement-downloader/search-helpers/send-requests-log')

jest.mock('../../../app/statement-downloader/search-helpers/filename-search')
jest.mock('../../../app/statement-downloader/search-helpers/constructed-filename-search')
jest.mock('../../../app/statement-downloader/search-helpers/db-search')
jest.mock('../../../app/statement-downloader/search-helpers/api-blob-search')
jest.mock('../../../app/statement-downloader/search-helpers/download-statement')
jest.mock('../../../app/statement-downloader/search-helpers/send-requests-log')

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
        expect(sendRequestsLog).not.toHaveBeenCalled()
      })

      test('should return error when criteria is undefined', async () => {
        const result = await searchStatements(undefined)
        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
        expect(sendRequestsLog).not.toHaveBeenCalled()
      })

      test('should return error when criteria is null', async () => {
        const result = await searchStatements(null)
        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
        expect(sendRequestsLog).not.toHaveBeenCalled()
      })

      test('should return error when criteria has only falsy values', async () => {
        const result = await searchStatements({ schemeId: 0, marketingYear: null })
        expect(result.statements).toEqual([])
        expect(result.error).toBe('At least one search criterion must be provided')
        expect(sendRequestsLog).not.toHaveBeenCalled()
      })
    })

    describe('search strategy waterfall', () => {
      test('should use filename search when filename provided', async () => {
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        filenameSearch.mockResolvedValue(mockResult)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue(null)
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ filename: 'test.pdf' })

        expect(filenameSearch).toHaveBeenCalledWith({ filename: 'test.pdf' })
        expect(constructedFilenameSearch).not.toHaveBeenCalled()
        expect(dbSearch).not.toHaveBeenCalled()
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should use constructed filename search when all required criteria provided', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null) // to verify call with user
        dbSearch.mockResolvedValue(null)
        apiBlobSearch.mockResolvedValue(null)

        const mockResult = {
          statements: [createMockStatement('constructed.pdf')],
          continuationToken: null
        }
        constructedFilenameSearch.mockResolvedValue(mockResult)

        const criteria = { schemeId: 1, marketingYear: 2024, frn: '1100021264', timestamp: '2025081908254124' }
        const result = await searchStatements(criteria, null, null)

        expect(filenameSearch).toHaveBeenCalledWith(criteria)
        expect(constructedFilenameSearch).toHaveBeenCalledWith(criteria)
        expect(dbSearch).not.toHaveBeenCalled()
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should use db search when previous strategies return null', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        const mockResult = {
          statements: [createMockStatement('db-result.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ schemeId: 1 })

        expect(filenameSearch).toHaveBeenCalled()
        expect(constructedFilenameSearch).toHaveBeenCalled()
        expect(dbSearch).toHaveBeenCalledWith(100, 0, { schemeId: 1 })
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(result).toEqual(mockResult)
        expect(sendRequestsLog).toHaveBeenCalled()
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
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { schemeId: 1 })
        expect(result).toEqual(mockResult)
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should return empty statements when all strategies return null or empty', async () => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        const result = await searchStatements({ schemeId: 1 })

        expect(result.statements).toEqual([])
        expect(result.continuationToken).toBeNull()
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should skip to next strategy when filename search returns empty array', async () => {
        filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue(null)
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ filename: 'nonexistent.pdf', schemeId: 1 })

        // Should return immediately when filename search returns empty array
        expect(result).toEqual({ statements: [], continuationToken: null })
        expect(constructedFilenameSearch).not.toHaveBeenCalled()
        expect(dbSearch).not.toHaveBeenCalled()
        expect(apiBlobSearch).not.toHaveBeenCalled()
        expect(sendRequestsLog).toHaveBeenCalled()
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
        expect(sendRequestsLog).toHaveBeenCalled()
      })
    })

    describe('criteria handling', () => {
      beforeEach(() => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })
      })

      test('should pass schemeId to strategies', async () => {
        await searchStatements({ schemeId: 1 })

        expect(dbSearch).toHaveBeenCalledWith(100, 0, { schemeId: 1 })
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { schemeId: 1 })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should pass marketingYear to strategies', async () => {
        await searchStatements({ marketingYear: 2025 })

        expect(dbSearch).toHaveBeenCalledWith(100, 0, { marketingYear: 2025 })
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { marketingYear: 2025 })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should pass frn to strategies', async () => {
        await searchStatements({ frn: '1234567890' })

        expect(dbSearch).toHaveBeenCalledWith(100, 0, { frn: '1234567890' })
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { frn: '1234567890' })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should pass timestamp to strategies', async () => {
        await searchStatements({ schemeId: 1, timestamp: '2025081908254124' })

        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { schemeId: 1, timestamp: '2025081908254124' })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should pass all criteria to strategies', async () => {
        const criteria = {
          schemeId: 1,
          marketingYear: 2024,
          frn: '1100021264',
          timestamp: '2025081908254124'
        }
        await searchStatements(criteria, 100, null)

        expect(constructedFilenameSearch).toHaveBeenCalledWith(criteria)
        expect(dbSearch).toHaveBeenCalledWith(100, 0, criteria)
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, criteria)
        expect(sendRequestsLog).toHaveBeenCalled()
      })
    })

    describe('pagination', () => {
      beforeEach(() => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
        dbSearch.mockResolvedValue({ statements: [], continuationToken: null })
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })
      })

      test('should handle custom limit', async () => {
        await searchStatements({ schemeId: 1 }, 100)

        expect(dbSearch).toHaveBeenCalledWith(100, 0, { schemeId: 1 })
        expect(apiBlobSearch).toHaveBeenCalledWith(100, null, { schemeId: 1 })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should handle continuation token', async () => {
        await searchStatements({ schemeId: 1 }, 50, 'next-token')

        expect(apiBlobSearch).toHaveBeenCalledWith(50, 'next-token', { schemeId: 1 })
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should return continuation token from apiBlobSearch', async () => {
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: 'next-page-token'
        }
        apiBlobSearch.mockResolvedValue(mockResult)

        const result = await searchStatements({ schemeId: 1 })

        expect(result.continuationToken).toBe('next-page-token')
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should handle invalid continuation token as 0', async () => {
        apiBlobSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await searchStatements({ schemeId: 1 }, 50, 'invalid-token')

        expect(apiBlobSearch).toHaveBeenCalledWith(50, 'invalid-token', { schemeId: 1 })
        expect(sendRequestsLog).toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      beforeEach(() => {
        filenameSearch.mockResolvedValue(null)
        constructedFilenameSearch.mockResolvedValue(null)
      })

      test('should handle null marketingYear', async () => {
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ schemeId: 1, marketingYear: null })

        expect(result.statements).toHaveLength(1)
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should handle null frn', async () => {
        const mockResult = {
          statements: [createMockStatement('test.pdf')],
          continuationToken: null
        }
        dbSearch.mockResolvedValue(mockResult)
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ schemeId: 1, frn: null })

        expect(result.statements).toHaveLength(1)
        expect(sendRequestsLog).toHaveBeenCalled()
      })

      test('should preserve all statement properties', async () => {
        const statement = createMockStatement('test.pdf')
        dbSearch.mockResolvedValue({ statements: [statement], continuationToken: null })
        apiBlobSearch.mockResolvedValue(null)

        const result = await searchStatements({ schemeId: 1 })

        expect(result.statements[0]).toEqual(statement)
        expect(sendRequestsLog).toHaveBeenCalled()
      })
    })
  })

  describe('downloadStatement', () => {
    test.each([
      ['standard filename', 'test-file.pdf'],
      ['filename with path', 'outbound/test-file.pdf'],
      ['filename with special characters', 'file with spaces (1).pdf'],
      ['empty filename', '']
    ])('should pass %s to downloadStatementHelper', async (_label, filename) => {
      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const result = await downloadStatement(filename)

      expect(downloadStatementHelper).toHaveBeenCalledWith(filename)
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
      apiBlobSearch.mockResolvedValue(null)

      const searchResults = await searchStatements({ schemeId: 1 })
      expect(searchResults.statements).toHaveLength(1)

      const mockDownloadResult = {
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      }
      downloadStatementHelper.mockResolvedValue(mockDownloadResult)

      const downloadResult = await downloadStatement(searchResults.statements[0].filename)
      expect(downloadStatementHelper).toHaveBeenCalledWith(searchResults.statements[0].filename)
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
      dbSearch.mockResolvedValue(null)
      apiBlobSearch.mockResolvedValue(null)

      const result = await searchStatements(criteria)
      expect(result.statements).toHaveLength(1)
      expect(dbSearch).not.toHaveBeenCalled()
      expect(apiBlobSearch).not.toHaveBeenCalled()
      expect(sendRequestsLog).toHaveBeenCalled()
    })
  })
})
