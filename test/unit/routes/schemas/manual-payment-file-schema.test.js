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
    expect(error.details[0].message).toBe('We were unable to upload your manual payment file. Your filename does not follow the required naming convention. Filename must match the agreed format, e.g. FFC_Manual_Batch_SFI23_20250626091445.csv')
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
    expect(error.details[0].message).toBe('We were unable to upload your manual payment file as the uploaded file is not a .CSV file. Only .CSV files are permitted.')
  })

  test('missing file object fails validation', () => {
    const invalidPayload = {}
    const { error } = manualPayamentFileSchema.validate(invalidPayload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.')
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
    expect(error.details[0].message).toBe('We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.')
  })
})
