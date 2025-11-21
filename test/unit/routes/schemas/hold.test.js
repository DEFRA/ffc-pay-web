const holdSchema = require('../../../../app/routes/schemas/hold')

describe('hold schema validator', () => {
  test('Valid object with required fields passes validation', () => {
    const { error } = holdSchema.validate({ frn: 1234567890, holdCategoryId: 1 })
    expect(error).toBeUndefined()
  })

  test('Valid object including optional selectScheme passes validation', () => {
    const { error } = holdSchema.validate({ frn: 1234567890, holdCategoryId: 1, selectScheme: 'someScheme' })
    expect(error).toBeUndefined()
  })

  test('Invalid: missing frn', () => {
    const { error } = holdSchema.validate({ holdCategoryId: 1 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Enter a 10-digit FRN/)
  })

  test('Invalid: frn is not a number', () => {
    const { error } = holdSchema.validate({ frn: 'abcdef', holdCategoryId: 1 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Enter a 10-digit FRN/)
  })

  test('Invalid: frn is less than minimum 10-digit number', () => {
    const { error } = holdSchema.validate({ frn: 999999999, holdCategoryId: 1 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Enter a 10-digit FRN/)
  })

  test('Invalid: frn is greater than maximum 10-digit number', () => {
    const { error } = holdSchema.validate({ frn: 10000000000, holdCategoryId: 1 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Enter a 10-digit FRN/)
  })

  test('Invalid: frn is a float instead of integer', () => {
    const { error } = holdSchema.validate({ frn: 1234567890.5, holdCategoryId: 1 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Enter a 10-digit FRN/)
  })

  test('Invalid: missing holdCategoryId', () => {
    const { error } = holdSchema.validate({ frn: 1234567890 })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Category is required/)
  })

  test('Invalid: holdCategoryId is not a number', () => {
    const { error } = holdSchema.validate({ frn: 1234567890, holdCategoryId: 'abc' })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Category is required/)
  })
})
