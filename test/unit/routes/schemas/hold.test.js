const holdSchema = require('../../../../app/routes/schemas/hold')

describe('hold schema validator', () => {
  const validInput = { frn: 1234567890, holdCategoryId: 1 }

  test('Valid object passes validation', () => {
    const { error } = holdSchema.validate(validInput)
    expect(error).toBeUndefined()
  })

  test('Valid object including optional selectScheme passes validation', () => {
    const { error } = holdSchema.validate({ ...validInput, selectScheme: 'someScheme' })
    expect(error).toBeUndefined()
  })

  describe('Invalid inputs', () => {
    test.each([
      [{ holdCategoryId: 1 }, /FRN \(Firm Reference Number\) must be 10 digits/],
      [{ frn: 'abcdef', holdCategoryId: 1 }, /FRN \(Firm Reference Number\) must be 10 digits/],
      [{ frn: 999999999, holdCategoryId: 1 }, /FRN \(Firm Reference Number\) must be 10 digits/],
      [{ frn: 10000000000, holdCategoryId: 1 }, /FRN \(Firm Reference Number\) must be 10 digits/],
      [{ frn: 1234567890.5, holdCategoryId: 1 }, /FRN \(Firm Reference Number\) must be 10 digits/],
      [{ frn: 1234567890 }, /Choose a hold category/],
      [{ frn: 1234567890, holdCategoryId: 'abc' }, /Choose a hold category/]
    ])('input %# produces expected error', (input, expectedMessage) => {
      const { error } = holdSchema.validate(input)
      expect(error).toBeDefined()
      expect(error.message).toMatch(expectedMessage)
    })
  })
})
