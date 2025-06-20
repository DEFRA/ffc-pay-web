const { BPS, CS } = require('../../../../app/constants/schemes')
const validationSchema = require('../../../../app/routes/schemas/claim-level-schema')

const withRequired = obj => ({
  'report-title': 'T',
  'report-url': '/u',
  ...obj
})

describe('shared-validation-models schema (dependsOnFrn=true, includePrn=false)', () => {
  describe('FRN present', () => {
    test('skips scheme/year/prn but still enforces revenue/Capital rules', () => {
      const result1 = validationSchema.validate(
        withRequired({ schemeId: BPS, frn: 1234567890 })
      )
      expect(result1.error).toBeUndefined()

      const result2 = validationSchema.validate(
        withRequired({ frn: 1234567890, schemeId: BPS, revenueOrCapital: 'Revenue' })
      )
      expect(result2.error).toBeDefined()
      expect(result2.error.details[0].message)
        .toBe('Revenue/Capital should not be selected for this scheme')

      const result3 = validationSchema.validate(
        withRequired({ frn: 1234567890, schemeId: CS, revenueOrCapital: 'Revenue' })
      )
      expect(result3.error).toBeUndefined()
    })
  })

  describe('SchemeId & Year', () => {
    test('requires schemeId when no FRN', () => {
      const { error } = validationSchema.validate(
        withRequired({ year: 2020, revenueOrCapital: '' })
      )
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('A scheme must be selected')
    })

    test('allows empty year for CS when no FRN', () => {
      const { error } = validationSchema.validate(
        withRequired({ schemeId: CS, revenueOrCapital: 'Revenue', year: '' })
      )
      expect(error).toBeUndefined()
    })
  })

  describe('revenueOrCapital field (no FRN)', () => {
    test('requires Revenue/Capital for CS', () => {
      const { error } = validationSchema.validate(
        withRequired({ schemeId: CS, revenueOrCapital: null })
      )
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Select Revenue or Capital')
    })

    test('rejects Revenue/Capital for non‑CS', () => {
      const { error } = validationSchema.validate(
        withRequired({ schemeId: BPS, revenueOrCapital: 'Revenue', year: 2020 })
      )
      expect(error).toBeDefined()
      expect(error.details[0].message)
        .toBe('Revenue/Capital should not be selected for this scheme')
    })
  })
})
