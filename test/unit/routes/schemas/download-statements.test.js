const schema = require('../../../../app/routes/schemas/download-statements')

describe('download-statements schema', () => {
  describe('valid payloads', () => {
    test('should reject payload with filename plus other criteria', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: 1,
        marketingYear: 2024,
        frn: 1100021264,
        timestamp: '2025101508224868'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('either the full filename')
    })

    test('should validate payload with only filename', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_BPS_2023_1234567890_2025081908254124.pdf'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate payload with only schemeId', () => {
      const payload = { schemeId: 1 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate payload with only marketingYear', () => {
      const payload = { marketingYear: 2024 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate payload with only frn', () => {
      const payload = { frn: 1100021264 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate payload with only timestamp', () => {
      const payload = { timestamp: '2025101508224868' }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate payload with multiple criteria', () => {
      const payload = {
        schemeId: 2,
        marketingYear: 2025,
        frn: 9999999999
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow empty string for filename', () => {
      const payload = {
        filename: '',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow null for filename', () => {
      const payload = {
        filename: null,
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow empty string for schemeId', () => {
      const payload = {
        schemeId: '',
        frn: 1100021264
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow null for marketingYear', () => {
      const payload = {
        marketingYear: null,
        frn: 1100021264
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow empty string for frn', () => {
      const payload = {
        frn: '',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should allow empty string for timestamp', () => {
      const payload = {
        timestamp: '',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })
  })

  describe('filename validation', () => {
    test('should validate filename with uppercase extension', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.PDF'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate filename with mixed case extension', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.Pdf'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should validate filename with different scheme abbreviations', () => {
      const filenames = [
        'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        'FFC_PaymentDelinkedStatement_BPS_2024_1100021264_2025101508224868.pdf',
        'FFC_PaymentDelinkedStatement_DP_2024_1100021264_2025101508224868.pdf',
        'FFC_PaymentDelinkedStatement_CS_2024_1100021264_2025101508224868.pdf'
      ]

      filenames.forEach(filename => {
        const { error } = schema.validate({ filename })
        expect(error).toBeUndefined()
      })
    })

    test('should validate filename with lowercase scheme abbreviation (case-insensitive)', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_sfi_2024_1100021264_2025101508224868.pdf'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject filename without FFC prefix', () => {
      const payload = {
        filename: 'ABC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Filename must match format')
    })

    test('should reject filename with invalid document type', () => {
      const payload = {
        filename: 'FFC_InvalidType_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Filename must match format')
    })

    test('should reject filename with invalid year format', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_24_1100021264_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject filename with invalid FRN format', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_123456789_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject filename with invalid timestamp format', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_202510150822486.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject filename without .pdf extension', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject filename with non-numeric year', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_ABCD_1100021264_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject filename with spaces', () => {
      const payload = {
        filename: 'FFC PaymentDelinkedStatement SFI 2024 1100021264 2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject completely invalid filename format', () => {
      const payload = {
        filename: 'invalid_filename.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Filename must match format')
    })
  })

  describe('schemeId validation', () => {
    test('should accept valid schemeId values', () => {
      const schemeIds = [1, 2, 3, 4, 5, 10, 100]

      schemeIds.forEach(schemeId => {
        const { error } = schema.validate({ schemeId })
        expect(error).toBeUndefined()
      })
    })

    test('should reject zero schemeId when no other criteria provided', () => {
      const payload = { schemeId: 0 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one search criterion must be provided')
    })

    test('should accept zero schemeId with other criteria', () => {
      const payload = { schemeId: 0, frn: 1100021264 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept negative schemeId', () => {
      const payload = { schemeId: -1 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject non-integer schemeId', () => {
      const payload = { schemeId: 1.5 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('integer')
    })

    test('should reject string schemeId', () => {
      const payload = { schemeId: 'abc' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('number')
    })
  })

  describe('marketingYear validation', () => {
    test('should accept minimum valid year (2020)', () => {
      const payload = { marketingYear: 2020 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept maximum valid year (2099)', () => {
      const payload = { marketingYear: 2099 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept year in middle of range', () => {
      const payload = { marketingYear: 2024 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject year below minimum (2019)', () => {
      const payload = { marketingYear: 2019 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('greater than or equal to 2020')
    })

    test('should reject year above maximum (2100)', () => {
      const payload = { marketingYear: 2100 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('less than or equal to 2099')
    })

    test('should reject non-integer year', () => {
      const payload = { marketingYear: 2024.5 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('integer')
    })

    test('should reject string year', () => {
      const payload = { marketingYear: 'abc' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('number')
    })

    test('should reject year 0', () => {
      const payload = { marketingYear: 0 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject negative year', () => {
      const payload = { marketingYear: -2024 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })
  })

  describe('frn validation', () => {
    test('should accept minimum valid FRN (1000000000)', () => {
      const payload = { frn: 1000000000 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept maximum valid FRN (9999999999)', () => {
      const payload = { frn: 9999999999 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept FRN in middle of range', () => {
      const payload = { frn: 1100021264 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject FRN below minimum (999999999)', () => {
      const payload = { frn: 999999999 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('greater than or equal to 1000000000')
    })

    test('should reject FRN above maximum (10000000000)', () => {
      const payload = { frn: 10000000000 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('less than or equal to 9999999999')
    })

    test('should reject non-integer FRN', () => {
      const payload = { frn: 1100021264.5 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('integer')
    })

    test('should reject string FRN', () => {
      const payload = { frn: 'abc' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('number')
    })

    test('should reject FRN 0 when no other criteria provided', () => {
      const payload = { frn: 0 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('greater than or equal to 1000000000')
    })

    test('should reject negative FRN', () => {
      const payload = { frn: -1100021264 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })
  })

  describe('timestamp validation', () => {
    test('should accept valid 16-digit timestamp', () => {
      const payload = { timestamp: '2025101508224868' }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept timestamp with all zeros', () => {
      const payload = { timestamp: '0000000000000000' }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept timestamp with all nines', () => {
      const payload = { timestamp: '9999999999999999' }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject timestamp with 15 digits', () => {
      const payload = { timestamp: '202510150822486' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Timestamp must be a 16 digit numeric')
    })

    test('should reject timestamp with 17 digits', () => {
      const payload = { timestamp: '20251015082248688' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Timestamp must be a 16 digit numeric')
    })

    test('should reject timestamp with non-numeric characters', () => {
      const payload = { timestamp: '202510150822486A' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Timestamp must be a 16 digit numeric')
    })

    test('should reject timestamp with spaces', () => {
      const payload = { timestamp: '2025 1015 0822486' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject timestamp with special characters', () => {
      const payload = { timestamp: '2025-10-15-08224' }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should reject numeric timestamp', () => {
      const payload = { timestamp: 2025101508224868 }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('string')
    })
  })

  describe('custom validation - at least one criterion', () => {
    test('should reject empty payload', () => {
      const payload = {}

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one search criterion must be provided')
    })

    test('should reject payload with all empty strings', () => {
      const payload = {
        filename: '',
        schemeId: '',
        marketingYear: '',
        frn: '',
        timestamp: ''
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one search criterion must be provided')
    })

    test('should reject payload with all null values', () => {
      const payload = {
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        timestamp: null
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one search criterion must be provided')
    })

    test('should accept payload with one valid criterion among empty values', () => {
      const payload = {
        filename: '',
        schemeId: 1,
        marketingYear: '',
        frn: null,
        timestamp: ''
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should accept payload with only valid filename among nulls', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: null,
        marketingYear: null
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject payload with filename and other criteria', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: 1
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('either the full filename')
    })
  })

  describe('combined field validation', () => {
    test('should reject all fields with filename and other criteria', () => {
      const payload = {
        filename: 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_2025101508224868.pdf',
        schemeId: 1,
        marketingYear: 2024,
        frn: 1100021264,
        timestamp: '2025101508224868'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('either the full filename')
    })

    test('should report first validation error when multiple fields invalid', () => {
      const payload = {
        schemeId: 1.5,
        marketingYear: 2019,
        frn: 999999999
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details).toHaveLength(1)
    })

    test('should accept mix of valid values and empty strings', () => {
      const payload = {
        filename: '',
        schemeId: 1,
        marketingYear: 2024,
        frn: '',
        timestamp: null
      }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should reject if one field is invalid even with other valid fields', () => {
      const payload = {
        schemeId: 1,
        marketingYear: 2024,
        frn: 999999999
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })
  })

  describe('edge cases', () => {
    test('should allow undefined payload (no input provided)', () => {
      const { error } = schema.validate(undefined)

      expect(error).toBeUndefined()
    })

    test('should reject null payload', () => {
      const { error } = schema.validate(null)

      expect(error).toBeDefined()
    })

    test('should reject payload with extra unknown fields', () => {
      const payload = {
        schemeId: 1,
        unknownField: 'value'
      }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('not allowed')
    })

    test('should handle very large schemeId', () => {
      const payload = { schemeId: 999999999 }

      const { error } = schema.validate(payload)

      expect(error).toBeUndefined()
    })

    test('should handle boundary year values correctly', () => {
      expect(schema.validate({ marketingYear: 2020 }).error).toBeUndefined()
      expect(schema.validate({ marketingYear: 2099 }).error).toBeUndefined()
    })

    test('should handle boundary FRN values correctly', () => {
      expect(schema.validate({ frn: 1000000000 }).error).toBeUndefined()
      expect(schema.validate({ frn: 9999999999 }).error).toBeUndefined()
    })

    test('should preserve leading zeros in timestamp string', () => {
      const payload = { timestamp: '0000000000000001' }

      const { error, value } = schema.validate(payload)

      expect(error).toBeUndefined()
      expect(value.timestamp).toBe('0000000000000001')
    })

    test('should handle boolean values for fields', () => {
      const payload = { schemeId: true }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should handle array values for fields', () => {
      const payload = { schemeId: [1, 2, 3] }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })

    test('should handle object values for fields', () => {
      const payload = { schemeId: { value: 1 } }

      const { error } = schema.validate(payload)

      expect(error).toBeDefined()
    })
  })
})
