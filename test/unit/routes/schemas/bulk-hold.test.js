const bulkSchema = require('../../../../app/routes/schemas/bulk-hold')

describe('Bulk Hold Validator', () => {
  const validFile = {
    filename: 'example.csv',
    path: '/path/to/file',
    headers: {
      'content-disposition': 'attachment; filename="example.csv"',
      'content-type': 'text/csv'
    },
    bytes: 1024
  }

  const validInput = { remove: true, holdCategoryId: 1, file: validFile }

  test('Valid object with required fields passes validation', () => {
    const { error } = bulkSchema.validate(validInput)
    expect(error).toBeUndefined()
  })

  test.each([
    [{ ...validInput, remove: false }, 'Valid object with remove false passes'],
    [{ ...validInput, selectScheme: 'someScheme' }, 'Valid object including optional selectScheme passes']
  ])('%s', (input) => {
    const { error } = bulkSchema.validate(input)
    expect(error).toBeUndefined()
  })

  const invalidCases = [
    [{ remove: true, file: validFile }, /Category is required/],
    [{ ...validInput, holdCategoryId: 'abc' }, /Category is required/],
    [{ ...validInput, file: { ...validFile, filename: undefined } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, path: undefined } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, headers: undefined } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, headers: { 'content-disposition': 'attachment; filename="example.csv"' } } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, headers: { 'content-disposition': 'attachment; filename="example.csv"', 'content-type': 'application/json' } } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, headers: { 'content-type': 'text/csv' } } }, /Provide a CSV file/],
    [{ ...validInput, file: { ...validFile, bytes: undefined } }, /Provide a CSV file/],
    [{ holdCategoryId: 1, file: validFile }, /Select add to add holds in bulk/],
    [{ ...validInput, remove: 'yes' }, /Select add to add holds in bulk/]
  ]

  test.each(invalidCases)('Invalid input %# produces expected error', (input, expectedMessage) => {
    const { error } = bulkSchema.validate(input)
    expect(error).toBeDefined()
    expect(error.message).toMatch(expectedMessage)
  })
})
