const manualPayamentFileSchema = require('../../../../app/routes/schemas/manual-payment-file-schema')

describe('Manual File Upload Schema', () => {
  test('valid filenames pass validation', () => {
    const validFilenames = [
      'FFC_Manual_Batch_SFI23_202510231609.csv', // 12-digit timestamp
      'FFC_Manual_Batch_SFI23_20251009165015.csv', // 14-digit timestamp
      'FFC_Manual_Batch_202510231609.csv', // no scheme, 12-digit
      'FFC_Manual_Batch_SFI_202510231609.csv' // scheme with letters only
    ]

    for (const filename of validFilenames) {
      const validFile = {
        file: {
          filename,
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
    }
  })

  test('invalid filename fails validation with helpful message', () => {
    const invalidFilenames = [
      'wrong_filename.csv',
      'FFC_Manual_Batch_SFI_2025_10_24(FFC_Manual_Batch_SFI_20251024) (1).csv', // user example with separators and copy suffix
      'FFC_Manual_Batch_SFI23_20251023.csv', // missing time part
      'FFC_Manual_Batch_SFI23_202513011200.csv' // invalid month
    ]

    for (const filename of invalidFilenames) {
      const invalidFile = {
        file: {
          filename,
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
      expect(error.details[0].message).toBe(
        'Invalid filename - We were unable to upload your manual payment file. Filenames must start with "FFC_Manual_Batch_". Optionally include a scheme (e.g. "SFI_" or "SFI23_"), then a timestamp in one of these formats: YYYYMMDDHHmm or YYYYMMDDHHmmss. The filename must end with ".csv". Examples: FFC_Manual_Batch_SFI23_202510231609.csv, FFC_Manual_Batch_202510231609.csv.'
      )
    }
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
    expect(error.details[0].message).toBe('Invalid file type - We were unable to upload your manual payment file as the uploaded file is not a .CSV file. Only .CSV files are permitted.')
  })

  test('missing file object fails validation', () => {
    const invalidPayload = {}
    const { error } = manualPayamentFileSchema.validate(invalidPayload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Unknown error - We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.')
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
    expect(error.details[0].message).toBe('Unknown error - We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.')
  })
})
