const bulkSchema = require('../../../../app/routes/schemas/bulk-closure')

describe('Bulk Closure Validator', () => {
  const validFile = {
    filename: 'example.csv',
    path: '/path/to/file',
    headers: {
      'content-disposition': 'attachment; filename="example.csv"',
      'content-type': 'text/csv'
    },
    bytes: 1024
  }

  test('Valid File Object passes validation', () => {
    expect(() => bulkSchema.validate({ file: validFile })).not.toThrow()
  })

  const invalidFiles = [
    { description: 'Missing filename', file: { ...validFile, filename: undefined } },
    { description: 'Missing path', file: { ...validFile, path: undefined } },
    { description: 'Missing headers', file: { ...validFile, headers: undefined } },
    { description: 'Missing headers -> content-type', file: { ...validFile, headers: { 'content-disposition': validFile.headers['content-disposition'] } } },
    { description: 'Headers content-type not text/csv', file: { ...validFile, headers: { ...validFile.headers, 'content-type': 'not-text-csv' } } },
    { description: 'Missing headers -> content-disposition', file: { ...validFile, headers: { 'content-type': 'text/csv' } } },
    { description: 'Missing bytes', file: { ...validFile, bytes: undefined } }
  ]

  test.each(invalidFiles)('Invalid File Object - $description', ({ file }) => {
    const validationResult = bulkSchema.validate({ file })
    expect(validationResult.error).toBeDefined()
    expect(validationResult.error.message).toMatch(/Provide a CSV file/)
  })
})
