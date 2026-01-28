const { parseStatementFilename } = require('../../../app/helpers/parse-statement-filename')

jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'SFI',
    2: 'BPS',
    3: 'CS',
    4: 'DP'
  }
}))

describe('parse-statement-filename', () => {
  describe('parseStatementFilename', () => {
    describe('valid filenames', () => {
      test('should parse valid statement filename with .pdf extension', () => {
        const filename = 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result).toEqual({
          documentType: 'PaymentDelinkedStatement',
          schemeId: 1,
          schemeAbbreviation: 'SFI',
          marketingYear: 2024,
          frn: 1100021264,
          timestamp: '2025101508224868',
          isValid: true
        })
      })

      test('should parse valid statement filename without extension', () => {
        const filename = 'FFC_PaymentStatement_BPS_2023_1234567890_2025081908254124'

        const result = parseStatementFilename(filename)

        expect(result).toEqual({
          documentType: 'PaymentStatement',
          schemeId: 2,
          schemeAbbreviation: 'BPS',
          marketingYear: 2023,
          frn: 1234567890,
          timestamp: '2025081908254124',
          isValid: true
        })
      })

      test('should parse DP scheme filename', () => {
        const filename = 'FFC_PaymentDelinkedStatement_DP_2025_9999999999_2026010112345678.pdf'

        const result = parseStatementFilename(filename)

        expect(result).toEqual({
          documentType: 'PaymentDelinkedStatement',
          schemeId: 4,
          schemeAbbreviation: 'DP',
          marketingYear: 2025,
          frn: 9999999999,
          timestamp: '2026010112345678',
          isValid: true
        })
      })

      test('should parse CS scheme filename', () => {
        const filename = 'FFC_Statement_CS_2024_5555555555_2025123112345678.pdf'

        const result = parseStatementFilename(filename)

        expect(result).toEqual({
          documentType: 'Statement',
          schemeId: 3,
          schemeAbbreviation: 'CS',
          marketingYear: 2024,
          frn: 5555555555,
          timestamp: '2025123112345678',
          isValid: true
        })
      })

      test('should handle .PDF extension (uppercase)', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.PDF'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(true)
        expect(result.timestamp).toBe('2025101508224868')
      })

      test('should handle mixed case .Pdf extension', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.Pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(true)
      })

      test('should parse different document types', () => {
        const filenames = [
          'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf',
          'FFC_DelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
          'FFC_Statement_SFI_2024_1100021264_2025101508224868.pdf'
        ]

        filenames.forEach(filename => {
          const result = parseStatementFilename(filename)
          expect(result.isValid).toBe(true)
        })
      })
    })

    describe('invalid filenames', () => {
      test('should return null for null input', () => {
        const result = parseStatementFilename(null)

        expect(result).toBeNull()
      })

      test('should return null for undefined input', () => {
        const result = parseStatementFilename(undefined)

        expect(result).toBeNull()
      })

      test('should return null for empty string', () => {
        const result = parseStatementFilename('')

        expect(result).toBeNull()
      })

      test('should return null for non-string input', () => {
        expect(parseStatementFilename(123)).toBeNull()
        expect(parseStatementFilename({})).toBeNull()
        expect(parseStatementFilename([])).toBeNull()
        expect(parseStatementFilename(true)).toBeNull()
      })

      test('should return object with isValid false for insufficient parts', () => {
        const result = parseStatementFilename('FFC_PaymentStatement_SFI_2024')

        expect(result).toBeNull()
      })

      test('should return object with isValid false for too few underscores', () => {
        const result = parseStatementFilename('FFC_PaymentStatement_SFI')

        expect(result).toBeNull()
      })

      test('should return null for filename not starting with FFC', () => {
        const result = parseStatementFilename('ABC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf')

        expect(result).toBeNull()
      })

      test('should return null for completely invalid format', () => {
        const result = parseStatementFilename('invalid_filename.pdf')

        expect(result).toBeNull()
      })

      test('should return null for single word filename', () => {
        const result = parseStatementFilename('filename.pdf')

        expect(result).toBeNull()
      })
    })

    describe('partial validation', () => {
      test('should set isValid false for unknown scheme abbreviation', () => {
        const filename = 'FFC_PaymentStatement_XXX_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(result.schemeId).toBeNull()
        expect(result.schemeAbbreviation).toBe('XXX')
      })

      test('should set isValid false for invalid year format (3 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_202_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(result.marketingYear).toBe(202)
      })

      test('should set isValid false for invalid year format (5 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_20245_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for non-numeric year', () => {
        const filename = 'FFC_PaymentStatement_SFI_ABCD_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(Number.isNaN(result.marketingYear)).toBe(true)
      })

      test('should set isValid false for invalid FRN format (9 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_110002126_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for invalid FRN format (11 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_11000212645_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for non-numeric FRN', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_ABCDEFGHIJ_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(Number.isNaN(result.frn)).toBe(true)
      })

      test('should set isValid false for invalid timestamp format (15 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_202510150822486.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for invalid timestamp format (17 digits)', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_20251015082248687.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for non-numeric timestamp', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_ABCDEFGHIJKLMNOP.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
      })

      test('should set isValid false for empty document type', () => {
        const filename = 'FFC__SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(result.documentType).toBe('')
      })

      test('should set isValid false when multiple validation rules fail', () => {
        const filename = 'FFC_PaymentStatement_XXX_202_110002126_202510150822486.pdf'

        const result = parseStatementFilename(filename)

        expect(result.isValid).toBe(false)
        expect(result.schemeId).toBeNull()
      })
    })

    describe('edge cases', () => {
      test('should handle filename with extra underscores at end', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868_extra_parts.pdf'

        const result = parseStatementFilename(filename)

        expect(result.documentType).toBe('PaymentStatement')
        expect(result.isValid).toBe(true)
      })

      test('should handle FRN with leading zeros', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_0000000001_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.frn).toBe(1)
        expect(result.isValid).toBe(true)
      })

      test('should handle minimum valid FRN', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_0000000000_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.frn).toBe(0)
        expect(result.isValid).toBe(true)
      })

      test('should handle maximum valid FRN', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_9999999999_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.frn).toBe(9999999999)
        expect(result.isValid).toBe(true)
      })

      test('should handle year 0000', () => {
        const filename = 'FFC_PaymentStatement_SFI_0000_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.marketingYear).toBe(0)
        expect(result.isValid).toBe(true)
      })

      test('should handle year 9999', () => {
        const filename = 'FFC_PaymentStatement_SFI_9999_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.marketingYear).toBe(9999)
        expect(result.isValid).toBe(true)
      })

      test('should handle timestamp with all zeros', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_0000000000000000.pdf'

        const result = parseStatementFilename(filename)

        expect(result.timestamp).toBe('0000000000000000')
        expect(result.isValid).toBe(true)
      })

      test('should handle timestamp with all nines', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_9999999999999999.pdf'

        const result = parseStatementFilename(filename)

        expect(result.timestamp).toBe('9999999999999999')
        expect(result.isValid).toBe(true)
      })

      test('should preserve original timestamp as string', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_0000000000000001.pdf'

        const result = parseStatementFilename(filename)

        expect(result.timestamp).toBe('0000000000000001')
        expect(typeof result.timestamp).toBe('string')
      })

      test('should handle very long document type name', () => {
        const filename = 'FFC_VeryLongPaymentStatementDocumentTypeName_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.documentType).toBe('VeryLongPaymentStatementDocumentTypeName')
        expect(result.isValid).toBe(true)
      })

      test('should handle whitespace in parts', () => {
        const filename = 'FFC_Payment Statement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.documentType).toBe('Payment Statement')
        expect(result.isValid).toBe(true)
      })

      test('should handle case-sensitive scheme abbreviations', () => {
        const filename = 'FFC_PaymentStatement_sfi_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBeNull()
        expect(result.isValid).toBe(false)
      })

      test('should not strip .pdf from middle of filename', () => {
        const filename = 'FFC_Payment.pdf.Statement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.documentType).toBe('Payment.pdf.Statement')
      })

      test('should handle filename with multiple .pdf extensions', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf.pdf'

        const result = parseStatementFilename(filename)

        expect(result.timestamp).toBe('2025101508224868.pdf')
        expect(result.isValid).toBe(false)
      })
    })

    describe('scheme abbreviation mapping', () => {
      test('should map SFI abbreviation to scheme ID 1', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBe(1)
        expect(result.schemeAbbreviation).toBe('SFI')
      })

      test('should map BPS abbreviation to scheme ID 2', () => {
        const filename = 'FFC_PaymentStatement_BPS_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBe(2)
        expect(result.schemeAbbreviation).toBe('BPS')
      })

      test('should map CS abbreviation to scheme ID 3', () => {
        const filename = 'FFC_PaymentStatement_CS_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBe(3)
        expect(result.schemeAbbreviation).toBe('CS')
      })

      test('should map DP abbreviation to scheme ID 4', () => {
        const filename = 'FFC_PaymentStatement_DP_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBe(4)
        expect(result.schemeAbbreviation).toBe('DP')
      })

      test('should return null schemeId for unmapped abbreviation', () => {
        const filename = 'FFC_PaymentStatement_UNKNOWN_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result.schemeId).toBeNull()
        expect(result.schemeAbbreviation).toBe('UNKNOWN')
        expect(result.isValid).toBe(false)
      })
    })

    describe('return value structure', () => {
      test('should return all expected properties for valid filename', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(result).toHaveProperty('documentType')
        expect(result).toHaveProperty('schemeId')
        expect(result).toHaveProperty('schemeAbbreviation')
        expect(result).toHaveProperty('marketingYear')
        expect(result).toHaveProperty('frn')
        expect(result).toHaveProperty('timestamp')
        expect(result).toHaveProperty('isValid')
      })

      test('should return numbers for year and frn', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(typeof result.marketingYear).toBe('number')
        expect(typeof result.frn).toBe('number')
      })

      test('should return string for timestamp', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(typeof result.timestamp).toBe('string')
      })

      test('should return boolean for isValid', () => {
        const filename = 'FFC_PaymentStatement_SFI_2024_1100021264_2025101508224868.pdf'

        const result = parseStatementFilename(filename)

        expect(typeof result.isValid).toBe('boolean')
      })
    })
  })
})
