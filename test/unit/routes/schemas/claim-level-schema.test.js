const { CS } = require('../../../../app/constants/schemes')
const validationSchema = require('../../../../app/routes/schemas/claim-level-and-transaction-summary-schema')

describe('Validation Schema', () => {
  describe('frn validation', () => {
    test('should accept a valid 10-digit FRN', () => {
      const result = validationSchema.validate({ frn: 1000000000, schemeId: 1 })
      expect(result.error).toBeUndefined()
    })

    test('should reject an FRN with less than 10 digits', () => {
      const result = validationSchema.validate({ frn: 999999999, schemeId: 1 })
      expect(result.error.message).toBe('The FRN, if present, must be 10 digits')
    })

    test('should reject an FRN with more than 10 digits', () => {
      const result = validationSchema.validate({ frn: 10000000000, schemeId: 1 })
      expect(result.error.message).toBe('The FRN, if present, must be 10 digits')
    })

    test('should not accept an empty string as FRN', () => {
      const result = validationSchema.validate({ frn: '', schemeId: 1 })
      expect(result.error.message).toBe('A valid year must be provided')
    })

    test('should accept an empty string as FRN for CS', () => {
      const result = validationSchema.validate({ frn: '', schemeId: CS, revenueOrCapital: 'Revenue' })
      expect(result.error).toBeUndefined()
    })

    test('should accept when FRN is not provided', () => {
      const result = validationSchema.validate({ schemeId: 1, year: 2020 })
      expect(result.error).toBeUndefined()
    })
  })

  describe('year validation', () => {
    test('should accept a valid year', () => {
      const result = validationSchema.validate({ year: 2020, schemeId: 1 })
      expect(result.error).toBeUndefined()
    })

    test('should reject a year before 1994', () => {
      const result = validationSchema.validate({ year: 1993, schemeId: 1 })
      expect(result.error.message).toBe('A valid year must be provided')
    })

    test('should reject a year after 2098', () => {
      const result = validationSchema.validate({ year: 2099, schemeId: 1 })
      expect(result.error.message).toBe('A valid year must be provided')
    })

    test('should allow empty year when schemeId is CS', () => {
      const result = validationSchema.validate({ year: '', schemeId: CS, revenueOrCapital: 'Revenue' })
      expect(result.error).toBeUndefined()
    })

    test('should require year when schemeId is not CS and FRN is not provided', () => {
      const result = validationSchema.validate({ schemeId: 1 })
      expect(result.error.message).toBe('A valid year must be provided')
    })

    test('should not require year when FRN is provided', () => {
      const result = validationSchema.validate({ frn: 1000000000, schemeId: 1 })
      expect(result.error).toBeUndefined()
    })
  })

  describe('revenueOrCapital validation', () => {
    test('should accept "Revenue" or "Capital" when schemeId is CS', () => {
      const result1 = validationSchema.validate({ revenueOrCapital: 'Revenue', schemeId: CS })
      const result2 = validationSchema.validate({ revenueOrCapital: 'Capital', schemeId: CS })
      expect(result1.error).toBeUndefined()
      expect(result2.error).toBeUndefined()
    })

    test('should reject no revenue or capital when schemeId is CS', () => {
      const result = validationSchema.validate({ schemeId: CS })
      expect(result.error.message).toBe('Select Revenue or Capital')
    })

    test('should accept empty string for revenueOrCapital when schemeId is not CS', () => {
      const result = validationSchema.validate({ revenueOrCapital: '', schemeId: 1, year: 2020 })
      expect(result.error).toBeUndefined()
    })

    test('should not require revenueOrCapital when FRN is provided', () => {
      const result = validationSchema.validate({ frn: 1000000000, schemeId: CS })
      expect(result.error).toBeUndefined()
    })
  })

  describe('schemeId validation', () => {
    test('should require schemeId when FRN is not provided', () => {
      const result = validationSchema.validate({ year: 2020 })
      expect(result.error.message).toBe('A scheme must be selected')
    })

    test('should not require schemeId when FRN is provided', () => {
      const result = validationSchema.validate({ frn: 1000000000 })
      expect(result.error).toBeUndefined()
    })

    test('should accept a valid schemeId', () => {
      const result = validationSchema.validate({ schemeId: 1, year: 2020 })
      expect(result.error).toBeUndefined()
    })
  })

  describe('combined validations', () => {
    test('should accept valid data for CS scheme', () => {
      const result = validationSchema.validate({ schemeId: CS, revenueOrCapital: 'Revenue', year: 2020 })
      expect(result.error).toBeUndefined()
    })

    test('should accept valid data for non-CS scheme', () => {
      const result = validationSchema.validate({ schemeId: 1, year: 2020, revenueOrCapital: '' })
      expect(result.error).toBeUndefined()
    })

    test('should accept valid data with FRN', () => {
      const result = validationSchema.validate({ frn: 1000000000, schemeId: 1 })
      expect(result.error).toBeUndefined()
    })
  })
})
