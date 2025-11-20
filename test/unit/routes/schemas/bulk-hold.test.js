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

  test('Valid object with required fields passes validation', () => {
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: validFile })
    expect(error).toBeUndefined()
  })

  test('Valid object with remove false passes validation', () => {
    const { error } = bulkSchema.validate({ remove: false, holdCategoryId: 1, file: validFile })
    expect(error).toBeUndefined()
  })

  test('Valid object including optional selectScheme passes validation', () => {
    const { error } = bulkSchema.validate({
      remove: true,
      holdCategoryId: 1,
      selectScheme: 'someScheme',
      file: validFile
    })
    expect(error).toBeUndefined()
  })

  test('Invalid: missing holdCategoryId', () => {
    const { error } = bulkSchema.validate({ remove: true, file: validFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Category is required/)
  })

  test('Invalid: holdCategoryId is string instead of integer', () => {
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 'abc', file: validFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Category is required/)
  })

  test('Invalid: missing filename in file object', () => {
    const invalidFile = { ...validFile }
    delete invalidFile.filename
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: missing path in file object', () => {
    const invalidFile = { ...validFile }
    delete invalidFile.path
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: missing headers in file object', () => {
    const invalidFile = { ...validFile }
    delete invalidFile.headers
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: headers missing content-type', () => {
    const invalidFile = {
      ...validFile,
      headers: {
        'content-disposition': 'attachment; filename="example.csv"'
      }
    }
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: headers content-type not text/csv', () => {
    const invalidFile = {
      ...validFile,
      headers: {
        'content-disposition': 'attachment; filename="example.csv"',
        'content-type': 'application/json'
      }
    }
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: headers missing content-disposition', () => {
    const invalidFile = {
      ...validFile,
      headers: {
        'content-type': 'text/csv'
      }
    }
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: missing bytes in file object', () => {
    const invalidFile = { ...validFile }
    delete invalidFile.bytes
    const { error } = bulkSchema.validate({ remove: true, holdCategoryId: 1, file: invalidFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Provide a CSV file/)
  })

  test('Invalid: missing remove field', () => {
    const { error } = bulkSchema.validate({ holdCategoryId: 1, file: validFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Select add to add holds in bulk/)
  })

  test('Invalid: remove field is not boolean', () => {
    const { error } = bulkSchema.validate({ remove: 'yes', holdCategoryId: 1, file: validFile })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/Select add to add holds in bulk/)
  })
})
