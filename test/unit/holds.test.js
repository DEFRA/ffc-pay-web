const { getHoldCategories } = require('../../app/holds')
jest.mock('../../app/api.js')
const { get } = require('../../app/api')

describe('Get holds categories', () => {
  const mockPaymentHoldCategories = [{
    holdCategoryId: 123,
    name: 'my hold category',
    schemeName: 'Scheme Name'
  }]

  const mockGetPaymentHoldCategories = (paymentHoldCategories) => {
    get.mockResolvedValue({ payload: { paymentHoldCategories } })
  }

  test('Should return a schemeName of "Annual Health and Welfare Review" when schemeName is "Vet Visits"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'Vet Visits'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories(mockGetPaymentHoldCategories)

    expect(result.schemes[0]).toBe('Annual Health and Welfare Review')
  })

  test('Should return a schemeName of "SFI" when schemeName is "SFI"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'SFI'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)
    const result = await getHoldCategories(mockGetPaymentHoldCategories)
    expect(result.schemes[0]).toBe('SFI')
  })

  test('Should return a schemeName of "SFI Pilot" when schemeName is "SFI Pilot"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'SFI Pilot'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)
    const result = await getHoldCategories(mockGetPaymentHoldCategories)
    expect(result.schemes[0]).toBe('SFI Pilot')
  })

  test('Should return a schemeName of "Lump Sums" when schemeName is "Lump Sums"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'Lump Sums'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)
    const result = await getHoldCategories(mockGetPaymentHoldCategories)
    expect(result.schemes[0]).toBe('Lump Sums')
  })

  test('Should return a schemeName of "LNR" when schemeName is "LNR"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'LNR'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)
    const result = await getHoldCategories(mockGetPaymentHoldCategories)
    expect(result.schemes[0]).toBe('LNR')
  })
})
