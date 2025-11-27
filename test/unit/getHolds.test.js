const { getHolds } = require('../../app/holds')
const { mockPaymentHolds } = require('../mocks/objects/holds')

jest.mock('../../app/api')
const { getProcessingData } = require('../../app/api')

describe('Get holds', () => {
  const setupMock = (holds) => getProcessingData.mockResolvedValue({ payload: { paymentHolds: holds } })

  afterEach(() => jest.clearAllMocks())

  test('formats and maps holds correctly', async () => {
    setupMock(mockPaymentHolds)
    const result = await getHolds()
    expect(result[0]).toMatchObject({
      dateTimeAdded: '19/08/2024 12:34',
      holdCategorySchemeName: 'SFI22',
      marketingYear: 'All',
      canBeRemoved: true
    })
  })

  test.each([
    [2, 50, true, '/payment-holds?page=2&pageSize=50'],
    [2, 50, false, '/payment-holds']
  ])('pagination params: page=%i, size=%i, usePagination=%p', async (page, size, usePagination, expected) => {
    await getHolds(page, size, usePagination)
    expect(getProcessingData).toHaveBeenCalledWith(expected)
  })

  test('filters closed holds', async () => {
    setupMock([{ ...mockPaymentHolds[0], dateTimeClosed: '2024-08-19T12:34:56Z' }])
    const result = await getHolds()
    expect(result).toEqual([])
  })

  test('handles canBeRemoved logic for BPS/non-BPS and missing fields', async () => {
    const holds = [
      { dateTimeClosed: null, dateTimeAdded: '2024-08-19T12:34:56Z', holdCategorySchemeName: 'BPS', marketingYear: '2024', agreementNumber: null, contractNumber: null },
      { dateTimeClosed: null, dateTimeAdded: '2024-08-19T12:34:56Z', holdCategorySchemeName: 'LNR', marketingYear: '2024', agreementNumber: null, contractNumber: '123' },
      { dateTimeClosed: null, dateTimeAdded: '2024-08-19T12:34:56Z', holdCategorySchemeName: 'BPS', marketingYear: null, agreementNumber: 'A1', contractNumber: 'C1' },
      { dateTimeClosed: null, dateTimeAdded: '2024-08-19T12:34:56Z', holdCategorySchemeName: 'SFI' }
    ]
    setupMock(holds)
    const result = await getHolds()
    expect(result.map(h => h.canBeRemoved)).toEqual([undefined, true, true, true])
    expect(result.map(h => h.marketingYear)).toEqual(['2024', '2024', 'All', 'All'])
    expect(result.map(h => h.agreementNumber)).toEqual(['All', 'All', 'A1', 'All'])
  })

  test('handles undefined paymentHolds gracefully', async () => {
    getProcessingData.mockResolvedValue({ payload: {} })
    const result = await getHolds()
    expect(result).toBeUndefined()
  })
})
