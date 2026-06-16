const schema = require('../../../../app/routes/schemas/bulk-hold')

test('valid payload passes validation', () => {
  const payload = {
    type: 'add',
    holdCategoryId: 1,
    selectScheme: 'scheme1',
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {
        'content-disposition': 'form-data; name="file"; filename="file.csv"',
        'content-type': 'text/csv'
      },
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeUndefined()
})

test('invalid type returns generic error message', () => {
  const payload = {
    type: 'update',
    holdCategoryId: 1,
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {
        'content-disposition': 'form-data; name="file"; filename="file.csv"',
        'content-type': 'text/csv'
      },
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeDefined()
  expect(error.details.some(d => d.message === 'An error has occurred. Please return to the manage payment holds in bulk page.')).toBe(true)
})

test('missing holdCategoryId returns Category is required', () => {
  const payload = {
    type: 'add',
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {
        'content-disposition': 'form-data; name="file"; filename="file.csv"',
        'content-type': 'text/csv'
      },
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeDefined()
  expect(error.details.some(d => d.message === 'Category is required')).toBe(true)
})

test('non-integer holdCategoryId returns Category is required', () => {
  const payload = {
    type: 'add',
    holdCategoryId: 1.5,
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {
        'content-disposition': 'form-data; name="file"; filename="file.csv"',
        'content-type': 'text/csv'
      },
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeDefined()
  expect(error.details.some(d => d.message === 'Category is required')).toBe(true)
})

test('invalid file content-type returns Provide a CSV file', () => {
  const payload = {
    type: 'add',
    holdCategoryId: 2,
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {
        'content-disposition': 'form-data; name="file"; filename="file.csv"',
        'content-type': 'application/octet-stream'
      },
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeDefined()
  expect(error.details.some(d => d.message === 'Provide a CSV file')).toBe(true)
})

test('file missing headers returns Provide a CSV file', () => {
  const payload = {
    type: 'add',
    holdCategoryId: 3,
    file: {
      filename: 'file.csv',
      path: '/path/to/file.csv',
      headers: {},
      bytes: 100
    }
  }
  const { error } = schema.validate(payload, { abortEarly: false })
  expect(error).toBeDefined()
  expect(error.details.some(d => d.message === 'Provide a CSV file')).toBe(true)
})
