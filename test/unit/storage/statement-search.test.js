const { searchStatements, downloadStatement } = require('../../../app/storage/statement-search')
const { getContainerClient } = require('../../../app/storage/container-manager')

jest.mock('../../../app/storage/container-manager')
jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'SFI',
    2: 'BPS',
    3: 'CS',
    4: 'DP'
  }
}))
jest.mock('../../../app/config', () => ({
  storageConfig: {
    statementsContainer: 'test-statements-container'
  }
}))

describe('statement-search', () => {
  let mockContainerClient
  let mockBlobIterator
  let mockBlockBlobClient

  beforeEach(() => {
    jest.clearAllMocks()

    mockBlockBlobClient = {
      download: jest.fn()
    }

    mockContainerClient = {
      listBlobsFlat: jest.fn(),
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient)
    }

    getContainerClient.mockResolvedValue(mockContainerClient)
  })

  describe('searchStatements', () => {
    const createMockBlob = (name, contentLength = 1024, lastModified = new Date('2025-01-15')) => ({
      name,
      properties: {
        contentLength,
        lastModified
      }
    })

    const setupBlobIterator = (blobs) => {
      mockBlobIterator = {
        async * [Symbol.asyncIterator] () {
          for (const blob of blobs) {
            yield blob
          }
        }
      }
      mockContainerClient.listBlobsFlat.mockReturnValue(mockBlobIterator)
    }

    test('should get container client with correct container name', async () => {
      setupBlobIterator([])

      await searchStatements()

      expect(getContainerClient).toHaveBeenCalledWith('test-statements-container')
    })

    test('should list blobs with outbound prefix', async () => {
      setupBlobIterator([])

      await searchStatements()

      expect(mockContainerClient.listBlobsFlat).toHaveBeenCalledWith({ prefix: 'outbound' })
    })

    test('should return empty array when no blobs found', async () => {
      setupBlobIterator([])

      const result = await searchStatements()

      expect(result).toEqual([])
    })

    test('should return empty array when criteria is empty object', async () => {
      setupBlobIterator([])

      const result = await searchStatements({})

      expect(result).toEqual([])
    })

    test('should return empty array when criteria is undefined', async () => {
      setupBlobIterator([])

      const result = await searchStatements(undefined)

      expect(result).toEqual([])
    })

    test('should filter out non-PDF files', async () => {
      const blobs = [
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.txt'),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.csv'),
        createMockBlob('outbound/file.doc')
      ]
      setupBlobIterator(blobs)

      const result = await searchStatements()

      expect(result).toEqual([])
    })

    test('should parse and return valid PDF statement', async () => {
      const blob = createMockBlob(
        'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
        2048,
        new Date('2025-01-20')
      )
      setupBlobIterator([blob])

      const result = await searchStatements()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '2025081908254124',
        size: 2048,
        lastModified: new Date('2025-01-20')
      })
    })

    test('should handle blob name without path prefix', async () => {
      const blob = createMockBlob('FFC_PaymentDelinkedStatement_DP_2025_9999999999_2025101508224868.pdf')
      setupBlobIterator([blob])

      const result = await searchStatements()

      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('FFC_PaymentDelinkedStatement_DP_2025_9999999999_2025101508224868.pdf')
    })

    test('should handle blob name with multiple path segments', async () => {
      const blob = createMockBlob('outbound/subfolder/FFC_PaymentDelinkedStatement_BPS_2024_1234567890_2025081908254124.pdf')
      setupBlobIterator([blob])

      const result = await searchStatements()

      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('FFC_PaymentDelinkedStatement_BPS_2024_1234567890_2025081908254124.pdf')
    })

    test('should filter out files with insufficient underscore-separated parts', async () => {
      const blobs = [
        createMockBlob('outbound/invalid.pdf'),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement.pdf'),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI.pdf'),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024.pdf'),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264.pdf')
      ]
      setupBlobIterator(blobs)

      const result = await searchStatements()

      expect(result).toEqual([])
    })

    test('should return multiple matching statements', async () => {
      const blobs = [
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf', 1024),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021265_2025081908254125.pdf', 2048),
        createMockBlob('outbound/FFC_PaymentDelinkedStatement_DP_2025_1100021266_2025081908254126.pdf', 4096)
      ]
      setupBlobIterator(blobs)

      const result = await searchStatements()

      expect(result).toHaveLength(3)
      expect(result[0].scheme).toBe('SFI')
      expect(result[1].scheme).toBe('BPS')
      expect(result[2].scheme).toBe('DP')
    })

    describe('filtering by schemeId', () => {
      test('should filter by schemeId using scheme abbreviation mapping', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021265_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_DP_2025_1100021266_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 1 })

        expect(result).toHaveLength(1)
        expect(result[0].scheme).toBe('SFI')
      })

      test('should return empty array when schemeId does not match any statements', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 2 })

        expect(result).toEqual([])
      })

      test('should handle schemeId that does not exist in abbreviations', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 999 })

        expect(result).toEqual([])
      })

      test('should filter BPS scheme correctly', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021265_2025081908254125.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 2 })

        expect(result).toHaveLength(1)
        expect(result[0].scheme).toBe('BPS')
      })

      test('should filter DP scheme correctly', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_DP_2025_1100021266_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 4 })

        expect(result).toHaveLength(1)
        expect(result[0].scheme).toBe('DP')
      })
    })

    describe('filtering by marketingYear', () => {
      test('should filter by marketingYear', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2025_1100021265_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2026_1100021266_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ marketingYear: 2025 })

        expect(result).toHaveLength(1)
        expect(result[0].year).toBe('2025')
      })

      test('should return empty array when marketingYear does not match', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ marketingYear: 2026 })

        expect(result).toEqual([])
      })

      test('should convert number marketingYear to string for comparison', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ marketingYear: 2024 })

        expect(result).toHaveLength(1)
      })
    })

    describe('filtering by FRN', () => {
      test('should filter by FRN', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021265_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021266_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: 1100021265 })

        expect(result).toHaveLength(1)
        expect(result[0].frn).toBe('1100021265')
      })

      test('should return empty array when FRN does not match', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: 9999999999 })

        expect(result).toEqual([])
      })

      test('should convert number FRN to string for comparison', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: 1100021264 })

        expect(result).toHaveLength(1)
      })

      test('should not match FRN when leading zeros differ', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_0000000001_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: 1 })

        expect(result).toEqual([])
      })

      test('should match FRN with leading zeros when exact match', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_0000000001_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: '0000000001' })

        expect(result).toHaveLength(1)
        expect(result[0].frn).toBe('0000000001')
      })
    })

    describe('filtering by timestamp', () => {
      test('should filter by timestamp', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ timestamp: '2025081908254125' })

        expect(result).toHaveLength(1)
        expect(result[0].timestamp).toBe('2025081908254125')
      })

      test('should return empty array when timestamp does not match', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ timestamp: '2025081908254999' })

        expect(result).toEqual([])
      })

      test('should strip .pdf extension from timestamp for comparison', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ timestamp: '2025081908254124' })

        expect(result).toHaveLength(1)
        expect(result[0].timestamp).toBe('2025081908254124')
      })
    })

    describe('filtering with multiple criteria', () => {
      test('should filter by schemeId and marketingYear', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2025_1100021265_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021266_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 1, marketingYear: 2024 })

        expect(result).toHaveLength(1)
        expect(result[0].scheme).toBe('SFI')
        expect(result[0].year).toBe('2024')
      })

      test('should filter by schemeId, marketingYear, and FRN', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021265_2025081908254125.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021264_2025081908254126.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({
          schemeId: 1,
          marketingYear: 2024,
          frn: 1100021264
        })

        expect(result).toHaveLength(1)
        expect(result[0].scheme).toBe('SFI')
        expect(result[0].year).toBe('2024')
        expect(result[0].frn).toBe('1100021264')
      })

      test('should filter by all criteria', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'),
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254125.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({
          schemeId: 1,
          marketingYear: 2024,
          frn: 1100021264,
          timestamp: '2025081908254124'
        })

        expect(result).toHaveLength(1)
        expect(result[0].timestamp).toBe('2025081908254124')
      })

      test('should return empty array when one criterion does not match', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({
          schemeId: 1,
          marketingYear: 2025
        })

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      test('should handle blob with zero content length', async () => {
        const blob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf', 0)
        setupBlobIterator([blob])

        const result = await searchStatements()

        expect(result).toHaveLength(1)
        expect(result[0].size).toBe(0)
      })

      test('should handle very large file size', async () => {
        const blob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf', 999999999)
        setupBlobIterator([blob])

        const result = await searchStatements()

        expect(result).toHaveLength(1)
        expect(result[0].size).toBe(999999999)
      })

      test('should handle null marketingYear criteria', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ marketingYear: null })

        expect(result).toHaveLength(1)
      })

      test('should handle null frn criteria', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ frn: null })

        expect(result).toHaveLength(1)
      })

      test('should handle undefined timestamp criteria', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ timestamp: undefined })

        expect(result).toHaveLength(1)
      })

      test('should handle empty string timestamp', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ timestamp: '' })

        expect(result).toHaveLength(1)
      })

      test('should handle zero schemeId', async () => {
        const blobs = [
          createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')
        ]
        setupBlobIterator(blobs)

        const result = await searchStatements({ schemeId: 0 })

        expect(result).toHaveLength(1)
      })

      test('should preserve all blob properties', async () => {
        const lastModified = new Date('2025-01-15T10:30:00Z')
        const blob = createMockBlob('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf', 5120, lastModified)
        setupBlobIterator([blob])

        const result = await searchStatements()

        expect(result[0]).toEqual({
          filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
          scheme: 'SFI',
          year: '2024',
          frn: '1100021264',
          timestamp: '2025081908254124',
          size: 5120,
          lastModified
        })
      })
    })

    describe('error handling', () => {
      test('should propagate error from getContainerClient', async () => {
        const error = new Error('Container client error')
        getContainerClient.mockRejectedValue(error)

        await expect(searchStatements()).rejects.toThrow('Container client error')
      })

      test('should handle error during blob iteration', async () => {
        const errorIterator = {
          async * [Symbol.asyncIterator] () {
            throw new Error('Iteration error')
          }
        }
        mockContainerClient.listBlobsFlat.mockReturnValue(errorIterator)

        await expect(searchStatements()).rejects.toThrow('Iteration error')
      })
    })
  })

  describe('downloadStatement', () => {
    beforeEach(() => {
      mockBlockBlobClient.download.mockResolvedValue({
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      })
    })

    test('should get container client with correct container name', async () => {
      await downloadStatement('test-file.pdf')

      expect(getContainerClient).toHaveBeenCalledWith('test-statements-container')
    })

    test('should prepend outbound/ prefix to filename without path', async () => {
      await downloadStatement('FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      )
    })

    test('should not prepend prefix to filename with path', async () => {
      await downloadStatement('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      )
    })

    test('should handle filename with multiple path segments', async () => {
      await downloadStatement('outbound/subfolder/file.pdf')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/subfolder/file.pdf'
      )
    })

    test('should call download on blob client', async () => {
      await downloadStatement('test-file.pdf')

      expect(mockBlockBlobClient.download).toHaveBeenCalledTimes(1)
    })

    test('should return download result', async () => {
      const downloadResult = {
        readableStreamBody: 'test-stream',
        contentLength: 2048
      }
      mockBlockBlobClient.download.mockResolvedValue(downloadResult)

      const result = await downloadStatement('test-file.pdf')

      expect(result).toEqual(downloadResult)
    })

    test('should handle special characters in filename', async () => {
      await downloadStatement('file with spaces (1).pdf')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/file with spaces (1).pdf'
      )
    })

    test('should handle filename with forward slash at start', async () => {
      await downloadStatement('/outbound/test.pdf')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        '/outbound/test.pdf'
      )
    })

    test('should handle empty filename', async () => {
      await downloadStatement('')

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith('outbound/')
    })

    describe('error handling', () => {
      test('should propagate error from getContainerClient', async () => {
        const error = new Error('Container client error')
        getContainerClient.mockRejectedValue(error)

        await expect(downloadStatement('test.pdf')).rejects.toThrow('Container client error')
      })

      test('should propagate error from download', async () => {
        const error = new Error('Download failed')
        mockBlockBlobClient.download.mockRejectedValue(error)

        await expect(downloadStatement('test.pdf')).rejects.toThrow('Download failed')
      })

      test('should handle blob not found error', async () => {
        const error = new Error('Blob not found')
        error.statusCode = 404
        mockBlockBlobClient.download.mockRejectedValue(error)

        await expect(downloadStatement('nonexistent.pdf')).rejects.toThrow('Blob not found')
      })

      test('should handle network timeout error', async () => {
        const error = new Error('Network timeout')
        error.code = 'ETIMEDOUT'
        mockBlockBlobClient.download.mockRejectedValue(error)

        await expect(downloadStatement('test.pdf')).rejects.toThrow('Network timeout')
      })

      test('should handle unauthorized access error', async () => {
        const error = new Error('Unauthorized')
        error.statusCode = 403
        mockBlockBlobClient.download.mockRejectedValue(error)

        await expect(downloadStatement('test.pdf')).rejects.toThrow('Unauthorized')
      })
    })
  })

  describe('integration scenarios', () => {
    test('should search and then download a specific statement', async () => {
      const blob = {
        name: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf',
        properties: {
          contentLength: 1024,
          lastModified: new Date('2025-01-15')
        }
      }

      const mockIterator = {
        async * [Symbol.asyncIterator] () {
          yield blob
        }
      }
      mockContainerClient.listBlobsFlat.mockReturnValue(mockIterator)

      const searchResults = await searchStatements({ schemeId: 1 })
      expect(searchResults).toHaveLength(1)

      // Reset mocks and setup for download
      jest.clearAllMocks()
      getContainerClient.mockResolvedValue(mockContainerClient)
      mockBlockBlobClient.download.mockResolvedValue({
        readableStreamBody: 'mock-stream',
        contentLength: 1024
      })

      const downloadResult = await downloadStatement(searchResults[0].filename)
      expect(mockBlockBlobClient.download).toHaveBeenCalled()
      expect(downloadResult.readableStreamBody).toBe('mock-stream')
    })

    test('should handle workflow with no matching results', async () => {
      const mockIterator = {
        async * [Symbol.asyncIterator] () {
          yield {
            name: 'outbound/FFC_PaymentDelinkedStatement_BPS_2024_1100021264_2025081908254124.pdf',
            properties: {
              contentLength: 1024,
              lastModified: new Date('2025-01-15')
            }
          }
        }
      }
      mockContainerClient.listBlobsFlat.mockReturnValue(mockIterator)

      const searchResults = await searchStatements({ schemeId: 1 })
      expect(searchResults).toHaveLength(0)
    })
  })
})
