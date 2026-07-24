const { processClosureData } = require('../../../app/closure')
jest.mock('../../../app/api.js')
const { SFI, IMPS } = require('../../mocks/values/source-system')
const { AGREEMENT_NUMBER } = require('../../mocks/values/agreement-number')
const { FRN } = require('../../mocks/values/frn')

describe('Process closures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should process single valid row correctly', async () => {
    const csv = `${SFI},${FRN},${AGREEMENT_NUMBER},2023-12-04`
    const result = await processClosureData(csv)
    expect(result.errors).toBeUndefined()
    expect(result.uploadData).toBeDefined()
    const row = result.uploadData[0]

    expect(row.sourceSystem).toBe(SFI)
    expect(row.frn).toBe(FRN.toString())
    expect(row.agreementNumber).toBe(AGREEMENT_NUMBER)
    expect(row.closureDate).toBe('2023-12-04')
  })

  test('Should process multiple valid rows correctly', async () => {
    const csv = `${SFI},${FRN},${AGREEMENT_NUMBER},2023-12-04\n${IMPS},${FRN + 1},new-agreement-number,2023-05-31`
    const result = await processClosureData(csv)
    expect(result.errors).toBeUndefined()
    expect(result.uploadData).toBeDefined()
    const row = result.uploadData[1]

    expect(row.sourceSystem).toBe(IMPS)
    expect(row.frn).toBe((FRN + 1).toString())
    expect(row.agreementNumber).toBe('new-agreement-number')
    expect(row.closureDate).toBe('2023-05-31')
  })

  test.each([
    { csv: `${SFI},${FRN},${AGREEMENT_NUMBER}`, error: 'The file is not in the expected format' },
    { csv: `${SFI},${FRN},${AGREEMENT_NUMBER},2023-12-04,extra`, error: 'The file is not in the expected format' }
  ])('Should return error for wrong row length', async ({ csv, error }) => {
    const result = await processClosureData(csv)
    expect(result.errors).toBeDefined()
    expect(result.errors.details[0].message).toBe(error)
  })

  test.each([
    { frn: 10000000001, message: 'Enter a 10-digit FRN' },
    { frn: 999999998, message: 'Enter a 10-digit FRN' },
    { frn: 'not-a-number', message: 'Enter a 10-digit FRN' },
    { frn: '', message: 'Enter a 10-digit FRN' }
  ])('Should return error for invalid FRN: $frn', async ({ frn, message }) => {
    const csv = `${SFI},${frn},${AGREEMENT_NUMBER},2023-12-04`
    const result = await processClosureData(csv)
    expect(result.errors).toBeDefined()
    expect(result.errors.details.some(e => e.message === message)).toBe(true)
  })

  test('Should return error if agreement number is missing', async () => {
    const csv = `${SFI},${FRN},,2023-12-04`
    const result = await processClosureData(csv)
    expect(result.errors).toBeDefined()
    expect(result.errors.details.some(e => e.message === 'Enter a valid agreement number')).toBe(true)
  })

  test('Should return error if scheme is missing', async () => {
    const csv = `,${FRN},${AGREEMENT_NUMBER},2023-12-04`
    const result = await processClosureData(csv)
    expect(result.errors).toBeDefined()
    expect(result.errors.details.some(e => e.message === 'Enter a valid scheme name')).toBe(true)
  })

  test.each([
    '2-12-04',
    '2023-87-05',
    '2023-12-76',
    ''
  ])('Should return error for invalid date: %s', async (closureDate) => {
    const csv = `${SFI},${FRN},${AGREEMENT_NUMBER},${closureDate}`
    const result = await processClosureData(csv)
    expect(result.errors).toBeDefined()
    expect(result.errors.details.some(e => e.message === 'Enter a valid date')).toBe(true)
  })
})
