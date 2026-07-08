const { constructedFilenameSearch } = require('../../../app/statement-downloader/search-helpers/constructed-filename-search')
const { filenameSearch } = require('../../../app/statement-downloader/search-helpers/filename-search')

jest.mock('../../../app/statement-downloader/search-helpers/filename-search')
jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'SFI',
    2: 'BPS',
    3: 'CS',
    4: 'DP'
  }
}))

describe('constructed-filename-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockStatement = (filename, scheme = 'SFI', year = '2024', frn = '1100021264', timestamp = '2025081908254124') => ({
    filename,
    scheme,
    year,
    frn,
    timestamp,
    size: 1024,
    lastModified: new Date('2025-01-15')
  })

  describe('validation and early returns', () => {
    test('should return null when criteria is undefined', async () => {
      const result = await constructedFilenameSearch(undefined)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when criteria is null', async () => {
      const result = await constructedFilenameSearch(null)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when criteria is empty object', async () => {
      const result = await constructedFilenameSearch({})

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is missing', async () => {
      const criteria = {
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when marketingYear is missing', async () => {
      const criteria = {
        schemeId: 1,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when frn is missing', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when timestamp is missing', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is null', async () => {
      const criteria = {
        schemeId: null,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when marketingYear is null', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: null,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when frn is null', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: null,
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when timestamp is null', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: null
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is undefined', async () => {
      const criteria = {
        schemeId: undefined,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when marketingYear is undefined', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: undefined,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when frn is undefined', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: undefined,
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when timestamp is undefined', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: undefined
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is empty string', async () => {
      const criteria = {
        schemeId: '',
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when marketingYear is empty string', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: '',
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when frn is empty string', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when timestamp is empty string', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: ''
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is zero', async () => {
      const criteria = {
        schemeId: 0,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when marketingYear is zero', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 0,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })
  })

  describe('scheme abbreviation validation', () => {
    test('should return null when schemeId does not exist in abbreviations', async () => {
      const criteria = {
        schemeId: 999,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is negative', async () => {
      const criteria = {
        schemeId: -1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })

    test('should return null when schemeId is very large number', async () => {
      const criteria = {
        schemeId: 9999999,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
      expect(filenameSearch).not.toHaveBeenCalled()
    })
  })

  describe('successful filename construction and search', () => {
    test('should construct filename for SFI scheme and call filenameSearch', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const mockResult = {
        statements: [createMockStatement('FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
      expect(result).toEqual(mockResult)
    })

    test('should construct filename for BPS scheme and call filenameSearch', async () => {
      const criteria = {
        schemeId: 2,
        marketingYear: 2024,
        frn: '9999999999',
        timestamp: '2024101508224868'
      }

      const mockResult = {
        statements: [createMockStatement('FFC_PaymentDelinkedStatement_BPS_2024_9999999999_2024101508224868.pdf', 'BPS')],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_BPS_2024_9999999999_2024101508224868.pdf'
      })
      expect(result).toEqual(mockResult)
    })

    test('should construct filename for CS scheme and call filenameSearch', async () => {
      const criteria = {
        schemeId: 3,
        marketingYear: 2025,
        frn: '1234567890',
        timestamp: '2025020315302020'
      }

      const mockResult = {
        statements: [createMockStatement('FFC_PaymentDelinkedStatement_CS_2025_1234567890_2025020315302020.pdf', 'CS')],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_CS_2025_1234567890_2025020315302020.pdf'
      })
      expect(result).toEqual(mockResult)
    })

    test('should construct filename for DP scheme and call filenameSearch', async () => {
      const criteria = {
        schemeId: 4,
        marketingYear: 2023,
        frn: '1000000000',
        timestamp: '2023091512000000'
      }

      const mockResult = {
        statements: [createMockStatement('FFC_PaymentDelinkedStatement_DP_2023_1000000000_2023091512000000.pdf', 'DP')],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_DP_2023_1000000000_2023091512000000.pdf'
      })
      expect(result).toEqual(mockResult)
    })

    test('should handle different marketingYear values', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2020,
        frn: '1100021264',
        timestamp: '2020081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2020_1100021264_2020081908254124.pdf'
      })
    })

    test('should handle different FRN values', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '5555555555',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_5555555555_2025081908254124.pdf'
      })
    })

    test('should handle different timestamp values', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2026123123595959'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2026123123595959.pdf'
      })
    })

    test('should handle string schemeId that maps to valid abbreviation', async () => {
      const criteria = {
        schemeId: '1',
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
    })

    test('should handle string marketingYear', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: '2024',
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
    })

    test('should handle numeric frn', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: 1100021264,
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
    })

    test('should handle numeric timestamp', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: 2025081908254124
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
    })
  })

  describe('filenameSearch result handling', () => {
    test('should return result from filenameSearch when statement found', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const mockResult = {
        statements: [createMockStatement('FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf')],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(result).toEqual(mockResult)
      expect(result.statements).toHaveLength(1)
    })

    test('should return empty result from filenameSearch when statement not found', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const mockResult = {
        statements: [],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(result).toEqual(mockResult)
      expect(result.statements).toEqual([])
    })

    test('should return null from filenameSearch', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue(null)

      const result = await constructedFilenameSearch(criteria)

      expect(result).toBeNull()
    })

    test('should handle filenameSearch returning multiple statements', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const mockResult = {
        statements: [
          createMockStatement('statement1.pdf'),
          createMockStatement('statement2.pdf')
        ],
        continuationToken: null
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(result).toEqual(mockResult)
      expect(result.statements).toHaveLength(2)
    })

    test('should handle filenameSearch returning continuation token', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const mockResult = {
        statements: [createMockStatement('statement.pdf')],
        continuationToken: 'next-token-123'
      }

      filenameSearch.mockResolvedValue(mockResult)

      const result = await constructedFilenameSearch(criteria)

      expect(result).toEqual(mockResult)
      expect(result.continuationToken).toBe('next-token-123')
    })
  })

  describe('error handling', () => {
    test('should propagate error from filenameSearch', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const error = new Error('Filename search failed')
      filenameSearch.mockRejectedValue(error)

      await expect(constructedFilenameSearch(criteria)).rejects.toThrow('Filename search failed')
    })

    test('should propagate blob not found error', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const error = new Error('BlobNotFound')
      error.code = 'BlobNotFound'
      filenameSearch.mockRejectedValue(error)

      await expect(constructedFilenameSearch(criteria)).rejects.toThrow('BlobNotFound')
    })

    test('should propagate network error', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124'
      }

      const error = new Error('Network timeout')
      error.code = 'ETIMEDOUT'
      filenameSearch.mockRejectedValue(error)

      await expect(constructedFilenameSearch(criteria)).rejects.toThrow('Network timeout')
    })
  })

  describe('edge cases with special values', () => {
    test('should handle very long timestamp', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '20250819082541241234567890'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20250819082541241234567890.pdf'
      })
    })

    test('should handle FRN with leading zeros', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '0000000001',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_0000000001_2025081908254124.pdf'
      })
    })

    test('should handle maximum FRN value', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '9999999999',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_9999999999_2025081908254124.pdf'
      })
    })

    test('should handle minimum FRN value', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1000000000',
        timestamp: '2025081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1000000000_2025081908254124.pdf'
      })
    })

    test('should handle year 2099', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2099,
        frn: '1100021264',
        timestamp: '2099081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2099_1100021264_2099081908254124.pdf'
      })
    })

    test('should handle year 2020', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2020,
        frn: '1100021264',
        timestamp: '2020081908254124'
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2020_1100021264_2020081908254124.pdf'
      })
    })
  })

  describe('integration with all schemes', () => {
    test('should work correctly for all defined schemes', async () => {
      const schemes = [
        { id: 1, abbrev: 'SFI' },
        { id: 2, abbrev: 'BPS' },
        { id: 3, abbrev: 'CS' },
        { id: 4, abbrev: 'DP' }
      ]

      for (const scheme of schemes) {
        const criteria = {
          schemeId: scheme.id,
          marketingYear: 2024,
          frn: '1100021264',
          timestamp: '2025081908254124'
        }

        filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

        await constructedFilenameSearch(criteria)

        expect(filenameSearch).toHaveBeenCalledWith({
          filename: `outbound/FFC_PaymentDelinkedStatement_${scheme.abbrev}_2024_1100021264_2025081908254124.pdf`
        })
      }
    })
  })

  describe('additional criteria properties', () => {
    test('should ignore additional properties in criteria', async () => {
      const criteria = {
        schemeId: 1,
        marketingYear: 2024,
        frn: '1100021264',
        timestamp: '2025081908254124',
        extraProperty: 'should-be-ignored',
        anotherProperty: 12345
      }

      filenameSearch.mockResolvedValue({ statements: [], continuationToken: null })

      await constructedFilenameSearch(criteria)

      expect(filenameSearch).toHaveBeenCalledWith({
        filename: 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025081908254124.pdf'
      })
    })
  })
})
