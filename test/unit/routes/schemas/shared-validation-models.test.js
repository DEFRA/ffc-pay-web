const { BPS, CS } = require('../../../../app/constants/schemes')
const { createValidationSchema } = require('../../../../app/routes/schemas/shared-validation-models')

describe('Validation Schema', () => {
  describe('General Validation', () => {
    test('validates FRN correctly', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ frn: 1234567890 })
      expect(error).toBeUndefined()
    })

    test('invalid FRN returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ frn: 123 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('The FRN, if present, must be 10 digits')
    })

    test('validates year correctly', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ year: 2025, schemeId: 1 })
      expect(error).toBeUndefined()
    })

    test('invalid year returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ year: 1990, schemeId: 1 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('A valid year must be provided')
    })

    test('validates schemeId correctly', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ year: 2020, schemeId: 1 })
      expect(error).toBeUndefined()
    })

    test('missing schemeId returns error', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({})
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('A scheme must be selected')
    })

    test('validates revenueOrCapital correctly when schemeId is CS', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ schemeId: CS, revenueOrCapital: 'Revenue' })
      expect(error).toBeUndefined()
    })

    test('invalid revenueOrCapital returns error when schemeId is CS', () => {
      const schema = createValidationSchema()
      const { error } = schema.validate({ schemeId: CS, revenueOrCapital: 'Invalid' })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Select Revenue or Capital')
    })
  })

  describe('Validation with dependsOnFrn', () => {
    test('validates PRN correctly when dependsOnFrn is true and frn is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ frn: 1234567890, prn: 1 })
      expect(error).toBeUndefined()
    })

    test('validates PRN correctly when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: BPS, prn: 1, year: 2020 })
      expect(error).toBeUndefined()
    })

    test('missing PRN returns error when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: BPS, year: 2020 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Provide a payment request number')
    })

    test('validates year correctly when dependsOnFrn is true and frn is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ frn: 1234567890, year: 2025 })
      expect(error).toBeUndefined()
    })

    test('validates year correctly when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: BPS, year: 2025, prn: 1 })
      expect(error).toBeUndefined()
    })

    test('missing year returns error when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: BPS })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('A valid year must be provided')
    })

    test('validates revenueOrCapital correctly when dependsOnFrn is true and frn is present', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ frn: 1234567890, revenueOrCapital: 'Revenue' })
      expect(error).toBeUndefined()
    })

    test('validates revenueOrCapital correctly when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: CS, revenueOrCapital: 'Revenue' })
      expect(error).toBeUndefined()
    })

    test('invalid revenueOrCapital returns error when dependsOnFrn is true and frn is absent', () => {
      const schema = createValidationSchema(true)
      const { error } = schema.validate({ schemeId: CS, revenueOrCapital: 'Invalid' })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Select Revenue or Capital')
    })
  })

  describe('Validation with includePrn set to false', () => {
    test('validates without PRN when includePrn is false', () => {
      const schema = createValidationSchema(false, false)
      const { error } = schema.validate({ schemeId: BPS, year: 2025, frn: 1234567890 })
      expect(error).toBeUndefined()
    })

    test('validates without PRN when includePrn is false and dependsOnFrn is true', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ schemeId: BPS, year: 2025, frn: 1234567890 })
      expect(error).toBeUndefined()
    })

    test('validates year correctly when includePrn is false and dependsOnFrn is true', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ frn: 1234567890, year: 2025 })
      expect(error).toBeUndefined()
    })

    test('validates schemeId correctly when includePrn is false and dependsOnFrn is true', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ frn: 1234567890, schemeId: CS })
      expect(error).toBeUndefined()
    })

    test('validates revenueOrCapital correctly when includePrn is false and dependsOnFrn is true', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ frn: 1234567890, revenueOrCapital: 'Revenue' })
      expect(error).toBeUndefined()
    })

    test('invalid revenueOrCapital returns error when includePrn is false and dependsOnFrn is true', () => {
      const schema = createValidationSchema(true, false)
      const { error } = schema.validate({ schemeId: CS, revenueOrCapital: 'Invalid' })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Select Revenue or Capital')
    })
  })
})
