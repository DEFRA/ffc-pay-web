const { BPS, CS, SFI } = require('../../../../app/constants/schemes')
const { createValidationSchema } = require('../../../../app/routes/schemas/shared-validation-models')

describe('Validation Schema - Comprehensive Tests', () => {
  const baseRequiredFields = {
    'report-title': 'Some report',
    'report-url': '/some/url'
  }

  describe('FRN Validation', () => {
    test('valid FRN (min edge)', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: SFI, frn: 1000000000 })
      expect(error).toBeUndefined()
    })

    test('valid FRN (max edge)', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: SFI, frn: 9999999999 })
      expect(error).toBeUndefined()
    })

    test('invalid FRN (too short)', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, frn: 12345 })
      expect(error.details[0].message).toBe('The FRN, if present, must be 10 digits')
    })

    test('invalid FRN (too long)', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, frn: 10000000000 })
      expect(error.details[0].message).toBe('The FRN, if present, must be 10 digits')
    })

    test('FRN as string should fail', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, frn: '1234567890' })
      expect(error).toBeDefined()
    })

    test('Empty FRN is allowed', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: SFI })
      expect(error).toBeUndefined()
    })
  })

  describe('Year Validation', () => {
    test('Year as string should not fail, as Joi converts', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: '2025', schemeId: SFI })
      expect(error).toBeUndefined()
    })

    test('Year as non number string should not fail', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 'string', schemeId: SFI })
      expect(error).toBeDefined()
    })

    test('Year less than valid range returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 1993, schemeId: SFI })
      expect(error.details[0].message).toBe('Enter a year')
    })

    test('Year greater than valid range returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2100, schemeId: SFI })
      expect(error.details[0].message).toBe('Enter a year')
    })

    test('Empty year is allowed for CS scheme', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: CS, revenueOrCapital: 'Revenue', year: null })
      expect(error).toBeUndefined()
    })
  })

  describe('SchemeId Validation', () => {
    test('Non-numeric schemeId should fail', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: 'abc' })
      expect(error.details[0].message).toBe('A scheme must be selected')
    })

    test('Optional schemeId when dependsOnFrn and FRN is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, frn: 1234567890, schemeId: BPS, prn: 1 })
      expect(error).toBeUndefined()
    })
  })

  describe('PRN Validation', () => {
    test('PRN as string should fail', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, prn: '123', schemeId: BPS })
      expect(error).toBeDefined()
    })

    test('PRN is allowed to be empty if FRN is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: SFI, frn: 1234567890, prn: null })
      expect(error).toBeUndefined()
    })
  })

  describe('Revenue/Capital Validation', () => {
    test('Rejects Revenue/Capital for non-CS scheme', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: BPS, revenueOrCapital: 'Revenue' })
      expect(error.details[0].message).toBe("Choose 'revenue' or 'capital'")
    })

    test('Invalid type for revenueOrCapital returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: CS, revenueOrCapital: 123 })
      expect(error.details[0].message).toBe("Choose 'revenue' or 'capital'")
    })

    test('Allows empty revenueOrCapital when not required', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: SFI })
      expect(error).toBeUndefined()
    })
  })

  describe('Required Base Fields', () => {
    test('Missing report-title returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ 'report-url': '/some/url' })
      expect(error.details[0].message).toBe('"report-title" is required')
    })

    test('Missing report-url returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ 'report-title': 'My report' })
      expect(error.details[0].message).toBe('"report-url" is required')
    })
  })

  describe('includePrn = false', () => {
    test('PRN field is not required when includePrn is false', () => {
      const schema = createValidationSchema(false, false)
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: BPS })
      expect(error).toBeUndefined()
    })
  })

  describe('PRN validation - dependsOnFrn = false', () => {
    test('PRN is required for BPS scheme when dependsOnFrn is false', () => {
      const schema = createValidationSchema(false)
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: BPS })
      expect(error.details[0].message).toBe('Enter a payment request number')
    })

    test('PRN is optional for non-BPS scheme when dependsOnFrn is false', () => {
      const schema = createValidationSchema(false)
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: SFI })
      expect(error).toBeUndefined()
    })
  })

  describe('PRN validation - dependsOnFrn = true', () => {
    test('PRN is required for BPS scheme when FRN is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025, schemeId: BPS })
      expect(error.details[0].message).toBe('Enter a payment request number')
    })
  })

  describe('Year validation - dependsOnFrn = true', () => {
    test('Year is optional when FRN is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, frn: 1234567890, schemeId: SFI })
      expect(error).toBeUndefined()
    })

    test('Year is optional for CS scheme when FRN is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: CS, revenueOrCapital: 'Revenue' })
      expect(error).toBeUndefined()
    })

    test('Year is required for non-CS scheme when FRN is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: SFI, prn: 1 })
      expect(error.details[0].message).toBe('Enter a year')
    })
  })

  describe('SchemeId validation - dependsOnFrn = true', () => {
    test('SchemeId is required when FRN is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ ...baseRequiredFields, year: 2025 })
      expect(error.details[0].message).toBe('A scheme must be selected')
    })
  })

  describe('Revenue/Capital - additional branches', () => {
    test('Capital is valid for CS scheme', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: CS, revenueOrCapital: 'Capital' })
      expect(error).toBeUndefined()
    })

    test('Empty revenueOrCapital is allowed for CS scheme due to base allow', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ ...baseRequiredFields, schemeId: CS, revenueOrCapital: '' })
      expect(error).toBeUndefined()
    })
  })
})
