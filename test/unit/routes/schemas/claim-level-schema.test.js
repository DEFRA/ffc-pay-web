const { BPS, CS } = require('../../../../app/constants/schemes')
const validationSchema = require('../../../../app/routes/schemas/claim-level-schema')

const withRequired = obj => ({
  'report-title': 'T',
  'report-url': '/u',
  ...obj
})

describe('shared-validation-models schema (dependsOnFrn=true, includePrn=false)', () => {
  describe('FRN present', () => {
    const frnTests = [
      [{ frn: 1234567890, schemeId: BPS }, true, 'FRN with BPS and no revenueOrCapital passes'],
      [{ frn: 1234567890, schemeId: BPS, revenueOrCapital: 'Revenue' }, false, 'FRN with BPS and Revenue fails'],
      [{ frn: 1234567890, schemeId: CS, revenueOrCapital: 'Revenue' }, true, 'FRN with CS and Revenue passes']
    ]

    test.each(frnTests)('%s', (input, shouldPass) => {
      const { error } = validationSchema.validate(withRequired(input))
      if (shouldPass) {
        expect(error).toBeUndefined()
      } else {
        expect(error).toBeDefined()
      }
    })
  })

  describe('SchemeId & Year when no FRN', () => {
    const schemeYearTests = [
      [{ year: 2020, revenueOrCapital: '' }, false, 'requires schemeId when no FRN'],
      [{ schemeId: CS, revenueOrCapital: 'Revenue', year: '' }, true, 'allows empty year for CS']
    ]

    test.each(schemeYearTests)('%s', (input, shouldPass) => {
      const { error } = validationSchema.validate(withRequired(input))
      if (shouldPass) {
        expect(error).toBeUndefined()
      } else {
        expect(error).toBeDefined()
      }
    })
  })

  describe('revenueOrCapital field (no FRN)', () => {
    const revenueCapitalTests = [
      [{ schemeId: CS, revenueOrCapital: null }, false, 'requires Revenue/Capital for CS'],
      [{ schemeId: BPS, revenueOrCapital: 'Revenue', year: 2020 }, false, 'rejects Revenue/Capital for non-CS']
    ]

    test.each(revenueCapitalTests)('%s', (input, shouldPass) => {
      const { error } = validationSchema.validate(withRequired(input))
      if (shouldPass) {
        expect(error).toBeUndefined()
      } else {
        expect(error).toBeDefined()
      }
    })
  })
})
