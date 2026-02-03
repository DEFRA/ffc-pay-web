const { getStatementsContainer, isValidPdfBlob, parseFilename, matchesCriteria, buildBlobPrefix } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')
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

describe('get-statement-parts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStatementsContainer', () => {
    test('should get container client on first call', async () => {
      jest.resetModules()
      const { getStatementsContainer: getContainer } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')
      const { getContainerClient: getClient } = require('../../../app/storage/container-manager')
      jest.mock('../../../app/storage/container-manager')

      const mockContainer = { name: 'statements' }
      getClient.mockResolvedValue(mockContainer)

      const result = await getContainer()

      expect(getClient).toHaveBeenCalled()
      expect(result).toBe(mockContainer)
    })

    test('should return same container reference from cache', async () => {
      const mockContainer = { name: 'statements' }
      getContainerClient.mockResolvedValue(mockContainer)

      const result1 = await getStatementsContainer()
      const result2 = await getStatementsContainer()

      expect(result1).toBe(result2)
    })

    describe('isValidPdfBlob', () => {
      test('should return true for blob with pdf extension', () => {
        const blob = { name: 'outbound/statement.pdf' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(true)
      })

      test('should return false for blob without pdf extension', () => {
        const blob = { name: 'outbound/statement.txt' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should return false for blob with null name', () => {
        const blob = { name: null }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should return false for blob with undefined name', () => {
        const blob = { name: undefined }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should return false for blob without name property', () => {
        const blob = {}

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should return false for null blob', () => {
        const result = isValidPdfBlob(null)

        expect(result).toBe(false)
      })

      test('should return false for undefined blob', () => {
        const result = isValidPdfBlob(undefined)

        expect(result).toBe(false)
      })

      test('should handle uppercase PDF extension', () => {
        const blob = { name: 'statement.PDF' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should handle mixed case pdf extension', () => {
        const blob = { name: 'statement.Pdf' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(false)
      })

      test('should handle filename with multiple dots', () => {
        const blob = { name: 'statement.backup.pdf' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(true)
      })

      test('should handle filename with nested path', () => {
        const blob = { name: 'outbound/2024/09/statement.pdf' }

        const result = isValidPdfBlob(blob)

        expect(result).toBe(true)
      })
    })

    describe('parseFilename', () => {
      describe('valid filenames', () => {
        test('should parse valid statement filename', () => {
          const blobName = 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000.pdf'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'SFI',
            year: '2024',
            frn: '1100021264',
            timestamp: '20240915120000'
          })
        })

        test('should parse filename without pdf extension', () => {
          const blobName = 'outbound/FFC_PaymentStatement_BPS_2023_9999999999_20250101000000'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'BPS',
            year: '2023',
            frn: '9999999999',
            timestamp: '20250101000000'
          })
        })

        test('should extract filename from path with multiple slashes', () => {
          const blobName = 'outbound/archive/2024/FFC_Statement_CS_2024_5555555555_20240515093000.pdf'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'CS',
            year: '2024',
            frn: '5555555555',
            timestamp: '20240515093000'
          })
        })

        test('should handle different scheme abbreviations', () => {
          const dpFilename = 'outbound/FFC_Statement_DP_2025_1234567890_20250630154500.pdf'

          const result = parseFilename(dpFilename)

          expect(result.scheme).toBe('DP')
        })

        test('should preserve timestamp as string', () => {
          const blobName = 'outbound/FFC_Statement_SFI_2024_1100021264_2025081908254124.pdf'

          const result = parseFilename(blobName)

          expect(result.timestamp).toBe('2025081908254124')
          expect(typeof result.timestamp).toBe('string')
        })

        test('should handle filename without path prefix', () => {
          const blobName = 'FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'SFI',
            year: '2024',
            frn: '1100021264',
            timestamp: '20240915120000'
          })
        })
      })

      describe('invalid filenames', () => {
        test('should return null for filename with too few parts', () => {
          const blobName = 'FFC_PaymentStatement_SFI_2024'

          const result = parseFilename(blobName)

          expect(result).toBeNull()
        })

        test('should return null for filename with insufficient underscores', () => {
          const blobName = 'FFC_Statement_SFI'

          const result = parseFilename(blobName)

          expect(result).toBeNull()
        })

        test('should return null for null blobName', () => {
          const result = parseFilename(null)

          expect(result).toBeNull()
        })

        test('should return null for undefined blobName', () => {
          const result = parseFilename(undefined)

          expect(result).toBeNull()
        })

        test('should return null for empty string', () => {
          const result = parseFilename('')

          expect(result).toBeNull()
        })

        test('should return null for string with only filename separator', () => {
          const result = parseFilename('/')

          expect(result).toBeNull()
        })

        test('should return null for filename with only slashes', () => {
          const result = parseFilename('///')

          expect(result).toBeNull()
        })
      })

      describe('timestamp handling', () => {
        test('should strip .pdf extension from timestamp', () => {
          const blobName = 'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'

          const result = parseFilename(blobName)

          expect(result.timestamp).toBe('20240915120000')
          expect(result.timestamp).not.toContain('.pdf')
        })

        test('should handle timestamp without .pdf extension', () => {
          const blobName = 'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000'

          const result = parseFilename(blobName)

          expect(result.timestamp).toBe('20240915120000')
        })

        test('should handle uppercase PDF extension in timestamp', () => {
          const blobName = 'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.PDF'

          const result = parseFilename(blobName)

          expect(result.timestamp).toBe('20240915120000.PDF')
        })
      })

      describe('edge cases', () => {
        test('should handle filename with extra text after timestamp', () => {
          const blobName = 'outbound/FFC_PaymentStatement_SFI_2024_1100021264_20240915120000_extra.pdf'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'SFI',
            year: '2024',
            frn: '1100021264',
            timestamp: '20240915120000'
          })
        })

        test('should handle very long path', () => {
          const blobName = 'a/b/c/d/e/f/g/h/i/j/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'

          const result = parseFilename(blobName)

          expect(result).toEqual({
            scheme: 'SFI',
            year: '2024',
            frn: '1100021264',
            timestamp: '20240915120000'
          })
        })

        test('should handle filename with leading zeros', () => {
          const blobName = 'outbound/FFC_Statement_SFI_0000_0000000001_20240915120000.pdf'

          const result = parseFilename(blobName)

          expect(result.year).toBe('0000')
          expect(result.frn).toBe('0000000001')
        })
      })
    })

    describe('matchesCriteria', () => {
      const baseParsed = {
        scheme: 'SFI',
        year: '2024',
        frn: '1100021264',
        timestamp: '20240915120000'
      }

      describe('scheme matching', () => {
        test('should match when scheme matches criteria schemeId', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 1 })

          expect(result).toBe(true)
        })

        test('should not match when scheme does not match schemeId', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 2 })

          expect(result).toBe(false)
        })

        test('should match all schemes when schemeId not provided', () => {
          const result = matchesCriteria(baseParsed, { marketingYear: 2024 })

          expect(result).toBe(true)
        })

        test('should match when schemeId is undefined (falsy skips check)', () => {
          const result = matchesCriteria(baseParsed, { schemeId: undefined })

          expect(result).toBe(true)
        })

        test('should match when schemeId is null (falsy skips check)', () => {
          const result = matchesCriteria(baseParsed, { schemeId: null })

          expect(result).toBe(true)
        })

        test('should match when schemeId is 0 (falsy skips check)', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 0 })

          expect(result).toBe(true)
        })
      })

      describe('year matching', () => {
        test('should match when year matches criteria marketingYear', () => {
          const result = matchesCriteria(baseParsed, { marketingYear: 2024 })

          expect(result).toBe(true)
        })

        test('should not match when year does not match marketingYear', () => {
          const result = matchesCriteria(baseParsed, { marketingYear: 2023 })

          expect(result).toBe(false)
        })

        test('should convert number year to string for comparison', () => {
          const result = matchesCriteria(baseParsed, { marketingYear: 2024 })

          expect(result).toBe(true)
        })

        test('should match all years when marketingYear not provided', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 1 })

          expect(result).toBe(true)
        })

        test('should match when marketingYear is 0 (falsy skips check)', () => {
          const result = matchesCriteria(baseParsed, { marketingYear: 0 })

          expect(result).toBe(true)
        })
      })

      describe('frn matching', () => {
        test('should match when frn matches criteria frn', () => {
          const result = matchesCriteria(baseParsed, { frn: '1100021264' })

          expect(result).toBe(true)
        })

        test('should match when frn number matches criteria frn string', () => {
          const result = matchesCriteria(baseParsed, { frn: 1100021264 })

          expect(result).toBe(true)
        })

        test('should not match when frn does not match', () => {
          const result = matchesCriteria(baseParsed, { frn: '9999999999' })

          expect(result).toBe(false)
        })

        test('should match all frn when frn not provided', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 1 })

          expect(result).toBe(true)
        })

        test('should match when frn is 0 (falsy skips check)', () => {
          const result = matchesCriteria(baseParsed, { frn: 0 })

          expect(result).toBe(true)
        })
      })

      describe('timestamp matching', () => {
        test('should match when timestamp matches criteria timestamp', () => {
          const result = matchesCriteria(baseParsed, { timestamp: '20240915120000' })

          expect(result).toBe(true)
        })

        test('should not match when timestamp does not match', () => {
          const result = matchesCriteria(baseParsed, { timestamp: '20240915120001' })

          expect(result).toBe(false)
        })

        test('should match all timestamps when timestamp not provided', () => {
          const result = matchesCriteria(baseParsed, { schemeId: 1 })

          expect(result).toBe(true)
        })

        test('should be case sensitive for timestamp', () => {
          const result = matchesCriteria(baseParsed, { timestamp: '20240915120000' })

          expect(result).toBe(true)
        })
      })

      describe('multiple criteria', () => {
        test('should match when all criteria match', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 1,
            marketingYear: 2024,
            frn: '1100021264',
            timestamp: '20240915120000'
          })

          expect(result).toBe(true)
        })

        test('should not match when one criterion fails', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 1,
            marketingYear: 2024,
            frn: '1100021264',
            timestamp: 'wrong'
          })

          expect(result).toBe(false)
        })

        test('should not match when scheme fails with other criteria', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 2,
            marketingYear: 2024,
            frn: '1100021264'
          })

          expect(result).toBe(false)
        })

        test('should not match when year fails with other criteria', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 1,
            marketingYear: 2025,
            frn: '1100021264'
          })

          expect(result).toBe(false)
        })

        test('should not match when frn fails with other criteria', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 1,
            marketingYear: 2024,
            frn: '9999999999'
          })

          expect(result).toBe(false)
        })
      })

      describe('empty criteria', () => {
        test('should match when criteria is empty object', () => {
          const result = matchesCriteria(baseParsed, {})

          expect(result).toBe(true)
        })
      })

      describe('edge cases', () => {
        test('should handle parsed with string numbers', () => {
          const parsed = {
            scheme: 'BPS',
            year: '2023',
            frn: '9999999999',
            timestamp: '20250101000000'
          }

          const result = matchesCriteria(parsed, {
            schemeId: 2,
            marketingYear: 2023,
            frn: 9999999999
          })

          expect(result).toBe(true)
        })

        test('should handle criteria with extra properties', () => {
          const result = matchesCriteria(baseParsed, {
            schemeId: 1,
            extraProperty: 'ignored'
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('buildBlobPrefix', () => {
      describe('without schemeId', () => {
        test('should return outbound when criteria is empty', () => {
          const result = buildBlobPrefix({})

          expect(result).toBe('outbound')
        })

        test('should return outbound when schemeId is undefined', () => {
          const result = buildBlobPrefix({ marketingYear: 2024, frn: '1100021264' })

          expect(result).toBe('outbound')
        })

        test('should return outbound when schemeId is null', () => {
          const result = buildBlobPrefix({ schemeId: null })

          expect(result).toBe('outbound')
        })

        test('should return outbound when schemeId is 0', () => {
          const result = buildBlobPrefix({ schemeId: 0 })

          expect(result).toBe('outbound')
        })

        test('should return outbound when schemeId has no abbreviation', () => {
          const result = buildBlobPrefix({ schemeId: 999 })

          expect(result).toBe('outbound')
        })

        test('should return outbound when criteria is undefined', () => {
          const result = buildBlobPrefix(undefined)

          expect(result).toBe('outbound')
        })

        test('should return outbound when criteria is null', () => {
          const result = buildBlobPrefix(null)

          expect(result).toBe('outbound')
        })
      })

      describe('with schemeId only', () => {
        test('should build prefix with schemeId 1 (SFI)', () => {
          const result = buildBlobPrefix({ schemeId: 1 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should build prefix with schemeId 2 (BPS)', () => {
          const result = buildBlobPrefix({ schemeId: 2 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_BPS')
        })

        test('should build prefix with schemeId 3 (CS)', () => {
          const result = buildBlobPrefix({ schemeId: 3 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_CS')
        })

        test('should build prefix with schemeId 4 (DP)', () => {
          const result = buildBlobPrefix({ schemeId: 4 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_DP')
        })
      })

      describe('with schemeId and marketingYear', () => {
        test('should add marketingYear to prefix', () => {
          const result = buildBlobPrefix({ schemeId: 1, marketingYear: 2024 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024')
        })

        test('should handle year 0 (falsy skips adding year)', () => {
          const result = buildBlobPrefix({ schemeId: 1, marketingYear: 0 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should not add year when marketingYear is undefined', () => {
          const result = buildBlobPrefix({ schemeId: 1, marketingYear: undefined })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should not add year when marketingYear is null', () => {
          const result = buildBlobPrefix({ schemeId: 1, marketingYear: null })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should handle different years', () => {
          const result2023 = buildBlobPrefix({ schemeId: 2, marketingYear: 2023 })
          const result2025 = buildBlobPrefix({ schemeId: 2, marketingYear: 2025 })

          expect(result2023).toBe('outbound/FFC_PaymentDelinkedStatement_BPS_2023')
          expect(result2025).toBe('outbound/FFC_PaymentDelinkedStatement_BPS_2025')
        })
      })

      describe('with schemeId and frn', () => {
        test('should add frn to prefix', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: '1100021264' })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_1100021264')
        })

        test('should handle frn 0 (falsy skips adding frn)', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: 0 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should not add frn when undefined', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: undefined })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should not add frn when null', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: null })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
        })

        test('should handle numeric frn', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: 9999999999 })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_9999999999')
        })
      })

      describe('with all criteria', () => {
        test('should build complete prefix with schemeId, marketingYear, and frn', () => {
          const result = buildBlobPrefix({
            schemeId: 1,
            marketingYear: 2024,
            frn: '1100021264'
          })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264')
        })

        test('should build prefix in correct order', () => {
          const result = buildBlobPrefix({
            schemeId: 2,
            marketingYear: 2023,
            frn: '9999999999'
          })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_BPS_2023_9999999999')
        })

        test('should include timestamp in criteria', () => {
          const result = buildBlobPrefix({
            schemeId: 1,
            marketingYear: 2024,
            frn: '1100021264',
            timestamp: '20240915120000'
          })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000')
        })

        test('should ignore extra properties in criteria', () => {
          const result = buildBlobPrefix({
            schemeId: 1,
            marketingYear: 2024,
            extraProperty: 'ignored'
          })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024')
        })
      })

      describe('edge cases', () => {
        test('should handle all schemes', () => {
          const schemes = [1, 2, 3, 4]
          const expected = ['SFI', 'BPS', 'CS', 'DP']

          schemes.forEach((schemeId, index) => {
            const result = buildBlobPrefix({ schemeId })
            expect(result).toContain(expected[index])
          })
        })

        test('should handle large frn', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: '9999999999' })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_9999999999')
        })

        test('should handle frn as string with leading zeros', () => {
          const result = buildBlobPrefix({ schemeId: 1, frn: '0000000001' })

          expect(result).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_0000000001')
        })
      })
    })
  })
})
