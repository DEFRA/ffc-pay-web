const manualPaymentFileSchema = require('../../../../app/routes/schemas/manual-payment-file-schema')

describe('Manual File Upload Schema', () => {
  const createFile = (filename, contentType = 'text/csv', includeBytes = true) => {
    const file = {
      filename,
      path: '/tmp/file.csv',
      headers: {
        'content-disposition': 'form-data name="file" filename="file.csv"',
        'content-type': contentType
      }
    }
    if (includeBytes) file.bytes = 1024
    return { file }
  }

  test.each([
    'FFC_Manual_Batch_SFI23_202510231609.csv',
    'FFC_Manual_Batch_SFI23_20251009165015.csv',
    'FFC_Manual_Batch_202510231609.csv',
    'FFC_Manual_Batch_SFI_202510231609.csv'
  ])('valid filename "%s" passes validation', (filename) => {
    const { error, value } = manualPaymentFileSchema.validate(createFile(filename))
    expect(error).toBeUndefined()
    expect(value.file.filename).toBe(filename)
  })

  const invalidFilenameMsg =
    'Invalid filename - We were unable to upload your manual payment file. Filenames must start with "FFC_Manual_Batch_". Optionally include a scheme (e.g. "SFI_" or "SFI23_"), then a timestamp in one of these formats: YYYYMMDDHHmm or YYYYMMDDHHmmss. The filename must end with ".csv". Examples: FFC_Manual_Batch_SFI23_202510231609.csv, FFC_Manual_Batch_202510231609.csv.'

  test.each([
    'wrong_filename.csv',
    'FFC_Manual_Batch_SFI_2025_10_24(FFC_Manual_Batch_SFI_20251024) (1).csv',
    'FFC_Manual_Batch_SFI23_20251023.csv',
    'FFC_Manual_Batch_SFI23_202513011200.csv'
  ])('invalid filename "%s" fails validation', (filename) => {
    const { error } = manualPaymentFileSchema.validate(createFile(filename))
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(invalidFilenameMsg)
  })

  test('invalid headers fails validation', () => {
    const { error } = manualPaymentFileSchema.validate(
      createFile('FFC_Manual_Batch_SFI23_20250626091445.csv', 'application/json')
    )
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Invalid file type - We were unable to upload your manual payment file as the uploaded file is not a .CSV file. Only .CSV files are permitted.'
    )
  })

  test.each([
    [{}],
    [{ filename: 'FFC_Manual_Batch_SFI23_20250626091445.csv', path: '/tmp/file.csv', headers: { 'content-disposition': 'form-data name="file" filename="file.csv"', 'content-type': 'text/csv' } }] // missing bytes
  ])('missing or incomplete file object fails validation', (invalidPayload) => {
    const { error } = manualPaymentFileSchema.validate(invalidPayload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Unknown error - We were unable to upload your manual payment file. This could be a temporary issue. Please try again later and if the problem persists, contact the Payment & Document Services Team.'
    )
  })
})
