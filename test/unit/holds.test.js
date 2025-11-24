const { getHoldCategories, getHolds } = require('../../app/holds')
jest.mock('../../app/api.js')
const { getProcessingData } = require('../../app/api')

describe('Get hold categories', () => {
  const mockPaymentHoldCategories = [{
    holdCategoryId: 123,
    name: 'my hold category',
    schemeName: 'Scheme Name'
  }]

  const setupMockCategories = (categories) => {
    getProcessingData.mockResolvedValue({ payload: { paymentHoldCategories: categories } })
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['Vet Visits', 'Annual Health and Welfare Review'],
    ['SFI', 'SFI22'],
    ['SFI Pilot', 'SFI Pilot'],
    ['Lump Sums', 'Lump Sums'],
    ['LNR', 'LNR']
  ])('maps schemeName "%s" to "%s"', async (input, expected) => {
    mockPaymentHoldCategories[0].schemeName = input
    setupMockCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0].name).toBe(expected)
  })

  test('handles empty paymentHoldCategories array', async () => {
    setupMockCategories([])

    const result = await getHoldCategories()

    expect(result.schemes).toEqual([])
    expect(result.paymentHoldCategories).toEqual([])
  })

  test('handles missing schemeName gracefully', async () => {
    mockPaymentHoldCategories[0].schemeName = undefined
    setupMockCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0].name).toBeUndefined()
  })
})

describe('Get holds', () => {
  const mockPaymentHolds = [{
    dateTimeClosed: null,
    dateTimeAdded: '2024-08-19T12:34:56Z',
    holdCategorySchemeName: 'SFI',
    marketingYear: null
  }]

  const setupMockHolds = (holds) => {
    getProcessingData.mockResolvedValue({ payload: { paymentHolds: holds } })
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns filtered holds with formatted dateTimeAdded and updated scheme names', async () => {
    setupMockHolds(mockPaymentHolds)

    const result = await getHolds()

    expect(result[0]).toMatchObject({
      dateTimeAdded: '19/08/2024 12:34',
      holdCategorySchemeName: 'SFI22',
      marketingYear: 'All',
      canBeRemoved: true
    })
  })

  test('uses pagination parameters when usePagination is true', async () => {
    await getHolds(2, 50, true)
    expect(getProcessingData).toHaveBeenCalledWith('/payment-holds?page=2&pageSize=50')
  })

  test('omits pagination parameters when usePagination is false', async () => {
    await getHolds(2, 50, false)
    expect(getProcessingData).toHaveBeenCalledWith('/payment-holds')
  })

  test('handles empty paymentHolds array', async () => {
    setupMockHolds([])

    const result = await getHolds()

    expect(result).toEqual([])
  })

  test('filters out closed holds', async () => {
    const closedHold = { ...mockPaymentHolds[0], dateTimeClosed: '2024-08-19T12:34:56Z' }
    setupMockHolds([closedHold])

    const result = await getHolds()

    expect(result).toEqual([])
  })

  test('handles canBeRemoved logic for BPS and non-BPS holds', async () => {
    const holds = [
      {
        dateTimeClosed: null,
        dateTimeAdded: '2024-08-19T12:34:56Z',
        holdCategorySchemeName: 'BPS',
        marketingYear: '2024',
        agreementNumber: null,
        contractNumber: null
      },
      {
        dateTimeClosed: null,
        dateTimeAdded: '2024-08-19T12:34:56Z',
        holdCategorySchemeName: 'LNR',
        marketingYear: '2024',
        agreementNumber: null,
        contractNumber: '123'
      },
      {
        dateTimeClosed: null,
        dateTimeAdded: '2024-08-19T12:34:56Z',
        holdCategorySchemeName: 'BPS',
        marketingYear: null,
        agreementNumber: 'A1',
        contractNumber: 'C1'
      }
    ]
    setupMockHolds(holds)

    const result = await getHolds()

    expect(result[0].canBeRemoved).toBeUndefined()
    expect(result[0].agreementNumber).toBe('All')
    expect(result[0].contractNumber).toBe('All')
    expect(result[1].canBeRemoved).toBe(true)
    expect(result[1].agreementNumber).toBe('All')
    expect(result[2].canBeRemoved).toBe(true)
    expect(result[2].marketingYear).toBe('All')
  })

  test('handles missing fields gracefully', async () => {
    const hold = {
      dateTimeClosed: null,
      dateTimeAdded: '2024-08-19T12:34:56Z',
      holdCategorySchemeName: 'SFI'
    }
    setupMockHolds([hold])

    const result = await getHolds()

    expect(result[0]).toMatchObject({
      marketingYear: 'All',
      agreementNumber: 'All',
      contractNumber: 'All',
      canBeRemoved: true
    })
  })

  test('handles undefined paymentHolds gracefully', async () => {
    getProcessingData.mockResolvedValue({ payload: {} })

    const result = await getHolds()

    expect(result).toBeUndefined()
  })
})
