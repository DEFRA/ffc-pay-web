const { blobListingSearch } = require('../../../app/statement-downloader/search-helpers/blob-listing-search')
const { getStatementsContainer, isValidPdfBlob, parseFilename, matchesCriteria, buildBlobPrefix } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')
const { createStatementResult } = require('../../../app/statement-downloader/search-helpers/create-statement')

jest.mock('../../../app/statement-downloader/search-helpers/get-statement-parts')
jest.mock('../../../app/statement-downloader/search-helpers/create-statement')

describe('blob-listing-search', () => {
  let mockStatementsContainer
  let mockPageIterator

  const createMockBlob = (name, contentLength = 1024, lastModified = new Date('2025-01-15')) => ({
    name,
    properties: {
      contentLength,
      lastModified
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockPageIterator = {
      [Symbol.asyncIterator]: jest.fn()
    }

    mockStatementsContainer = {
      listBlobsFlat: jest.fn().mockReturnValue({
        byPage: jest.fn().mockReturnValue(mockPageIterator)
      })
    }

    getStatementsContainer.mockResolvedValue(mockStatementsContainer)
    isValidPdfBlob.mockReturnValue(true)
    parseFilename.mockReturnValue({
      scheme: 'SFI',
      year: '2024',
      frn: '1100021264',
      timestamp: '2025081908254124'
    })
    matchesCriteria.mockReturnValue(true)
    buildBlobPrefix.mockReturnValue('outbound')
    createStatementResult.mockImplementation((blob, parsed) => ({
      filename: blob.name.split('/').pop(),
      scheme: parsed.scheme,
      year: parsed.year,
      frn: parsed.frn,
      timestamp: parsed.timestamp,
      size: blob.properties.contentLength,
      lastModified: blob.properties.lastModified
    }))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('basic search functionality', () => {
    test('should search for statements with default criteria', async () => {
      const mockBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(getStatementsContainer).toHaveBeenCalled()
      expect(mockStatementsContainer.listBlobsFlat).toHaveBeenCalledWith({ prefix: 'outbound' })
      expect(result.statements).toHaveLength(1)
      expect(result.continuationToken).toBeNull()
    })

    test('should return empty statements when no blobs found', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, { schemeId: 1 })

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })

    test('should filter out invalid PDF blobs', async () => {
      const validBlob = createMockBlob('outbound/valid.pdf')
      const invalidBlob = createMockBlob('outbound/invalid.txt')

      isValidPdfBlob.mockImplementation((blob) => blob.name.endsWith('.pdf'))

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [validBlob, invalidBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
    })

    test('should filter out blobs with unparseable filenames', async () => {
      const parseableBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
      const unparseableBlob = createMockBlob('outbound/invalid-format.pdf')

      parseFilename.mockImplementation((name) => {
        if (name.includes('invalid')) return null
        return {
          scheme: 'SFI',
          year: '2024',
          frn: '1100021264',
          timestamp: '2025081908254124'
        }
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [parseableBlob, unparseableBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
    })

    test('should filter out blobs that do not match criteria', async () => {
      const matchingBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
      const nonMatchingBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_9999999999_2025081908254124.pdf')

      matchesCriteria.mockImplementation((parsed, criteria) => {
        if (criteria.schemeId === 1) {
          return parsed.scheme === 'SFI'
        }
        return false
      })

      parseFilename.mockImplementation((name) => {
        if (name.includes('_SFI_')) {
          return { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '2025081908254124' }
        }
        return { scheme: 'BPS', year: '2024', frn: '9999999999', timestamp: '2025081908254124' }
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [matchingBlob, nonMatchingBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, { schemeId: 1 })

      expect(result.statements).toHaveLength(1)
    })
  })

  describe('pagination', () => {
    test('should handle custom page limit', async () => {
      const blobs = Array.from({ length: 5 }, (_, i) =>
        createMockBlob(`outbound/statement${i}.pdf`)
      )

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: blobs },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(100, null, {})

      expect(mockStatementsContainer.listBlobsFlat().byPage).toHaveBeenCalledWith({
        maxPageSize: 100,
        continuationToken: undefined
      })
      expect(result.statements).toHaveLength(5)
    })

    test('should handle continuation token', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, 'next-token-123', {})

      expect(mockStatementsContainer.listBlobsFlat().byPage).toHaveBeenCalledWith({
        maxPageSize: 50,
        continuationToken: 'next-token-123'
      })
      expect(result.statements).toHaveLength(1)
    })

    test('should return continuation token from page result', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: 'next-page-token'
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.continuationToken).toBe('next-page-token')
    })

    test('should stop processing when page limit is reached', async () => {
      const blobs = Array.from({ length: 10 }, (_, i) =>
        createMockBlob(`outbound/statement${i}.pdf`)
      )

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: blobs.slice(0, 5) },
          continuationToken: 'page2-token'
        }
        yield {
          segment: { blobItems: blobs.slice(5, 10) },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(5, null, {})

      expect(result.statements).toHaveLength(5)
      expect(result.continuationToken).toBe('page2-token')
    })

    test('should handle multiple pages when page limit not reached', async () => {
      const page1Blobs = Array.from({ length: 3 }, (_, i) =>
        createMockBlob(`outbound/statement${i}.pdf`)
      )
      const page2Blobs = Array.from({ length: 2 }, (_, i) =>
        createMockBlob(`outbound/statement${i + 3}.pdf`)
      )

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: page1Blobs },
          continuationToken: 'page2-token'
        }
        yield {
          segment: { blobItems: page2Blobs },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(5)
      expect(result.continuationToken).toBeNull()
    })

    test('should stop iteration when no continuation token', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
      expect(result.continuationToken).toBeNull()
    })

    test('should handle null continuation token in page', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.continuationToken).toBeNull()
    })

    test('should handle undefined continuation token in page', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] }
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.continuationToken).toBeNull()
    })
  })

  describe('blob prefix building', () => {
    test('should use buildBlobPrefix with criteria', async () => {
      buildBlobPrefix.mockReturnValue('outbound/FFC_PaymentDelinkedStatement_SFI')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      await blobListingSearch(50, null, { schemeId: 1 })

      expect(buildBlobPrefix).toHaveBeenCalledWith({ schemeId: 1 })
      expect(mockStatementsContainer.listBlobsFlat).toHaveBeenCalledWith({
        prefix: 'outbound/FFC_PaymentDelinkedStatement_SFI'
      })
    })

    test('should use buildBlobPrefix with multiple criteria', async () => {
      buildBlobPrefix.mockReturnValue('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const criteria = { schemeId: 1, marketingYear: 2024, frn: '1100021264' }
      await blobListingSearch(50, null, criteria)

      expect(buildBlobPrefix).toHaveBeenCalledWith(criteria)
      expect(mockStatementsContainer.listBlobsFlat).toHaveBeenCalledWith({
        prefix: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264'
      })
    })
  })

  describe('page structure variations', () => {
    test('should handle page with segment.blobItems structure', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
    })

    test('should handle page with direct blobItems structure', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          blobItems: [mockBlob],
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
    })

    test('should handle page with no blobItems', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: {},
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toEqual([])
    })

    test('should handle page with null segment', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: null,
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toEqual([])
    })

    test('should handle page with undefined segment', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toEqual([])
    })
  })

  describe('statement result creation', () => {
    test('should call createStatementResult for each matching blob', async () => {
      const mockBlob1 = createMockBlob('outbound/statement1.pdf')
      const mockBlob2 = createMockBlob('outbound/statement2.pdf')

      parseFilename.mockReturnValue({
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '2025081908254124'
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob1, mockBlob2] },
          continuationToken: null
        }
      }

      await blobListingSearch(50, null, {})

      expect(createStatementResult).toHaveBeenCalledTimes(2)
      expect(createStatementResult).toHaveBeenCalledWith(mockBlob1, expect.any(Object))
      expect(createStatementResult).toHaveBeenCalledWith(mockBlob2, expect.any(Object))
    })

    test('should pass parsed data to createStatementResult', async () => {
      const mockBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
      const parsedData = {
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      parseFilename.mockReturnValue(parsedData)

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      await blobListingSearch(50, null, {})

      expect(createStatementResult).toHaveBeenCalledWith(mockBlob, parsedData)
    })

    test('should preserve blob properties in statement results', async () => {
      const lastModified = new Date('2025-01-20')
      const mockBlob = createMockBlob('outbound/statement.pdf', 2048, lastModified)

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements[0].size).toBe(2048)
      expect(result.statements[0].lastModified).toEqual(lastModified)
    })
  })

  describe('timeout handling', () => {
    test('should timeout if search takes longer than default timeout', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        await new Promise(resolve => setTimeout(resolve, 30000))
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const searchPromise = blobListingSearch(50, null, {})

      jest.advanceTimersByTime(25000)

      await expect(searchPromise).rejects.toThrow('Blob listing search timed out')
    })

    test('should timeout if search takes longer than custom timeout', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        await new Promise(resolve => setTimeout(resolve, 15000))
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const searchPromise = blobListingSearch(50, null, {}, 10000)

      jest.advanceTimersByTime(10000)

      await expect(searchPromise).rejects.toThrow('Blob listing search timed out')
    })

    test('should set BLOB_TIMEOUT error code on timeout', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        await new Promise(resolve => setTimeout(resolve, 30000))
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const searchPromise = blobListingSearch(50, null, {})

      jest.advanceTimersByTime(25000)

      try {
        await searchPromise
      } catch (err) {
        expect(err.code).toBe('BLOB_TIMEOUT')
      }
    })

    test('should complete successfully if search finishes before timeout', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const searchPromise = blobListingSearch(50, null, {}, 25000)

      jest.advanceTimersByTime(1000)

      const result = await searchPromise

      expect(result.statements).toHaveLength(1)
    })
  })

  describe('error handling', () => {
    test('should propagate error from getStatementsContainer', async () => {
      const error = new Error('Container access denied')
      getStatementsContainer.mockRejectedValue(error)

      await expect(blobListingSearch(50, null, {})).rejects.toThrow('Container access denied')
    })

    test('should propagate error from listBlobsFlat', async () => {
      const error = new Error('List operation failed')
      mockStatementsContainer.listBlobsFlat.mockImplementation(() => {
        throw error
      })

      await expect(blobListingSearch(50, null, {})).rejects.toThrow('List operation failed')
    })

    test('should propagate error from async iteration', async () => {
      const error = new Error('Iteration failed')
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        throw error
      }

      await expect(blobListingSearch(50, null, {})).rejects.toThrow('Iteration failed')
    })

    test('should handle error in parseFilename gracefully', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')
      parseFilename.mockImplementation(() => {
        throw new Error('Parse error')
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      await expect(blobListingSearch(50, null, {})).rejects.toThrow('Parse error')
    })

    test('should handle error in createStatementResult gracefully', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')
      createStatementResult.mockImplementation(() => {
        throw new Error('Create result error')
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      await expect(blobListingSearch(50, null, {})).rejects.toThrow('Create result error')
    })
  })

  describe('edge cases', () => {
    test('should handle zero page limit', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(0, null, {})

      expect(result.statements).toEqual([])
    })

    test('should handle very large page limit', async () => {
      const blobs = Array.from({ length: 100 }, (_, i) =>
        createMockBlob(`outbound/statement${i}.pdf`)
      )

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: blobs },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(1000, null, {})

      expect(result.statements).toHaveLength(100)
    })

    test('should handle null continuation token parameter', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(mockStatementsContainer.listBlobsFlat().byPage).toHaveBeenCalledWith({
        maxPageSize: 50,
        continuationToken: undefined
      })
      expect(result.statements).toHaveLength(1)
    })

    test('should handle empty criteria object', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(buildBlobPrefix).toHaveBeenCalledWith({})
      expect(result.statements).toHaveLength(1)
    })

    test('should handle criteria with all fields', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await blobListingSearch(50, null, criteria)

      expect(buildBlobPrefix).toHaveBeenCalledWith(criteria)
      expect(matchesCriteria).toHaveBeenCalledWith(expect.any(Object), criteria)
      expect(result.statements).toHaveLength(1)
    })

    test('should handle blobs with different file sizes', async () => {
      const smallBlob = createMockBlob('outbound/small.pdf', 512)
      const largeBlob = createMockBlob('outbound/large.pdf', 10485760)

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [smallBlob, largeBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(2)
      expect(result.statements[0].size).toBe(512)
      expect(result.statements[1].size).toBe(10485760)
    })

    test('should handle blobs with different last modified dates', async () => {
      const oldBlob = createMockBlob('outbound/old.pdf', 1024, new Date('2020-01-01'))
      const newBlob = createMockBlob('outbound/new.pdf', 1024, new Date('2025-12-31'))

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [oldBlob, newBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(2)
      expect(result.statements[0].lastModified).toEqual(new Date('2020-01-01'))
      expect(result.statements[1].lastModified).toEqual(new Date('2025-12-31'))
    })

    test('should handle empty pages followed by non-empty pages', async () => {
      const mockBlob = createMockBlob('outbound/statement.pdf')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: 'page2-token'
        }
        yield {
          segment: { blobItems: [mockBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toHaveLength(1)
    })

    test('should handle multiple empty pages', async () => {
      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [] },
          continuationToken: 'page2-token'
        }
        yield {
          segment: { blobItems: [] },
          continuationToken: 'page3-token'
        }
        yield {
          segment: { blobItems: [] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, {})

      expect(result.statements).toEqual([])
      expect(result.continuationToken).toBeNull()
    })
  })

  describe('integration scenarios', () => {
    test('should handle complete search workflow with filtering', async () => {
      const sfiBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
      const bpsBlob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_9999999999_2025081908254124.pdf')
      const invalidBlob = createMockBlob('outbound/invalid.txt')

      isValidPdfBlob.mockImplementation((blob) => blob.name.endsWith('.pdf'))
      parseFilename.mockImplementation((name) => {
        if (name.includes('_SFI_')) {
          return { scheme: 'SFI', year: '2024', frn: '1100021264', timestamp: '2025081908254124' }
        } else if (name.includes('_BPS_')) {
          return { scheme: 'BPS', year: '2024', frn: '9999999999', timestamp: '2025081908254124' }
        }
        return null
      })
      matchesCriteria.mockImplementation((parsed, criteria) => {
        if (criteria.schemeId === 1) {
          return parsed.scheme === 'SFI'
        }
        return true
      })
      buildBlobPrefix.mockReturnValue('outbound/FFC_PaymentDelinkedStatement_SFI')

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: [sfiBlob, bpsBlob, invalidBlob] },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, { schemeId: 1 })

      expect(result.statements).toHaveLength(1)
      expect(result.statements[0].scheme).toBe('SFI')
    })

    test('should handle paginated results with mixed matching', async () => {
      const page1Blobs = [
        createMockBlob('outbound/match1.pdf'),
        createMockBlob('outbound/nomatch1.pdf')
      ]
      const page2Blobs = [
        createMockBlob('outbound/match2.pdf'),
        createMockBlob('outbound/nomatch2.pdf')
      ]

      let callCount = 0
      matchesCriteria.mockImplementation((parsed, criteria) => {
        callCount++
        return callCount % 2 === 1
      })

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: page1Blobs },
          continuationToken: 'page2-token'
        }
        yield {
          segment: { blobItems: page2Blobs },
          continuationToken: null
        }
      }

      const result = await blobListingSearch(50, null, { schemeId: 1 })

      expect(result.statements).toHaveLength(2)
    })

    test('should handle search with exact page limit match', async () => {
      const blobs = Array.from({ length: 10 }, (_, i) =>
        createMockBlob(`outbound/statement${i}.pdf`)
      )

      mockPageIterator[Symbol.asyncIterator] = async function * () {
        yield {
          segment: { blobItems: blobs },
          continuationToken: 'next-token'
        }
      }

      const result = await blobListingSearch(10, null, {})

      expect(result.statements).toHaveLength(10)
      expect(result.continuationToken).toBe('next-token')
    })
  })
})
