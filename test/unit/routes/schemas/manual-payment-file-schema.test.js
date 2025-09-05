const manualPayamentFileSchema = require('../../../../app/routes/schemas/manual-payment-file-schema')

describe('Manual File Upload Schema', () => {
  test('valid file passes validation', () => {
    const validFile = {
      file: {
        filename: 'FFC_Manual_Batch_SFI23_20250626091445.csv',
        path: '/tmp/file.csv',
        headers: {
          'content-disposition': 'form-data name="file" filename="file.csv"',
          'content-type': 'text/csv'
        },
        bytes: 1024
      }
    }

    const { error, value } = manualPayamentFileSchema.validate(validFile)
    expect(error).toBeUndefined()
    expect(value).toEqual(validFile)
  })

  test('invalid filename fails validation', () => {
    const invalidFile = {
      file: {
        filename: 'wrong_filename.csv',
        path: '/tmp/file.csv',
        headers: {
          'content-disposition': 'form-data name="file" filename="file.csv"',
          'content-type': 'text/csv'
        },
        bytes: 1024
      }
    }

    const { error } = manualPayamentFileSchema.validate(invalidFile)
    expect(error).toBeDefined()
    expect(error.details[0].message).toMatch(/Filename must match FFC_Manual_Batch/)
  })

  test('invalid headers fails validation', () => {
    const invalidFile = {
      file: {
        filename: 'FFC_Manual_Batch_SFI23_20250626091445.csv',
        path: '/tmp/file.csv',
        headers: {
          'content-disposition': 'form-data name="file" filename="file.csv"',
          'content-type': 'application/json'
        },
        bytes: 1024
      }
    }

    const { error } = manualPayamentFileSchema.validate(invalidFile)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('File must be a CSV (content-type: text/csv)')
  })

  test('missing file object fails validation', () => {
    const invalidPayload = {}
    const { error } = manualPayamentFileSchema.validate(invalidPayload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Unknown validation error')
  })

  test('missing bytes fails validation', () => {
    const invalidFile = {
      file: {
        filename: 'FFC_Manual_Batch_SFI23_20250626091445.csv',
        path: '/tmp/file.csv',
        headers: {
          'content-disposition': 'form-data name="file" filename="file.csv"',
          'content-type': 'text/csv'
        }
      }
    }

    const { error } = manualPayamentFileSchema.validate(invalidFile)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Unknown validation error')
  })
})
