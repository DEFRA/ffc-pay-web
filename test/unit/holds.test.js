const { getHoldCategories, getHolds } = require('../../app/holds')
jest.mock('../../app/api.js')
const { getProcessingData } = require('../../app/api')

describe('Get holds categories', () => {
  const mockPaymentHoldCategories = [{
    holdCategoryId: 123,
    name: 'my hold category',
    schemeName: 'Scheme Name'
  }]

  const mockGetPaymentHoldCategories = (paymentHoldCategories) => {
    getProcessingData.mockResolvedValue({ payload: { paymentHoldCategories } })
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should return a schemeName of "Annual Health and Welfare Review" when schemeName is "Vet Visits"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'Vet Visits'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe('Annual Health and Welfare Review')
  })

  test('Should return a schemeName of "SFI22" when schemeName is "SFI"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'SFI'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe('SFI22')
  })

  test('Should return a schemeName of "SFI Pilot" when schemeName is "SFI Pilot"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'SFI Pilot'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe('SFI Pilot')
  })

  test('Should return a schemeName of "Lump Sums" when schemeName is "Lump Sums"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'Lump Sums'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe('Lump Sums')
  })

  test('Should return a schemeName of "LNR" when schemeName is "LNR"', async () => {
    mockPaymentHoldCategories[0].schemeName = 'LNR'
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe('LNR')
  })

  test('Should handle an empty paymentHoldCategories array', async () => {
    mockGetPaymentHoldCategories([])

    const result = await getHoldCategories()

    expect(result.schemes).toEqual([])
    expect(result.paymentHoldCategories).toEqual([])
  })

  test('Should handle a missing schemeName gracefully', async () => {
    mockPaymentHoldCategories[0].schemeName = undefined
    mockGetPaymentHoldCategories(mockPaymentHoldCategories)

    const result = await getHoldCategories()

    expect(result.schemes[0]).toBe(undefined)
  })
})

describe('Get holds', () => {
  const mockPaymentHolds = [{
    dateTimeClosed: null,
    dateTimeAdded: '2024-08-19T12:34:56Z',
    holdCategorySchemeName: 'SFI',
    marketingYear: null
  }]

  const mockGetPaymentHolds = (paymentHolds) => {
    getProcessingData.mockResolvedValue({ payload: { paymentHolds } })
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should return filtered holds with formatted dateTimeAdded and updated scheme names', async () => {
    mockGetPaymentHolds(mockPaymentHolds)

    const result = await getHolds()

    expect(result[0].dateTimeAdded).toBe('19/08/2024 12:34')
    expect(result[0].holdCategorySchemeName).toBe('SFI22')
    expect(result[0].marketingYear).toBe('All')
    expect(result[0].canBeRemoved).toBe(true)
  })

  test('Should use pagination parameters when usePagination is true', async () => {
    await getHolds(2, 50, true)
    expect(getProcessingData).toHaveBeenCalledWith('/payment-holds?page=2&pageSize=50')
  })

  test('Should omit pagination parameters when usePagination is false', async () => {
    await getHolds(2, 50, false)
    expect(getProcessingData).toHaveBeenCalledWith('/payment-holds')
  })

  test('Should handle empty paymentHolds array', async () => {
    mockGetPaymentHolds([])

    const result = await getHolds()

    expect(result).toEqual([])
  })

  test('Should filter out holds that are closed (dateTimeClosed is not null)', async () => {
    const closedHold = { ...mockPaymentHolds[0], dateTimeClosed: '2024-08-19T12:34:56Z' }
    mockGetPaymentHolds([closedHold])

    const result = await getHolds()

    expect(result).toEqual([])
  })

  test('Should not set canBeRemoved if holdCategorySchemeName is "BPS" and field is not "marketingYear"', async () => {
    const hold = {
      dateTimeClosed: null,
      dateTimeAdded: '2024-08-19T12:34:56Z',
      holdCategorySchemeName: 'BPS',
      marketingYear: '2024',
      agreementNumber: null,
      contractNumber: null
    }
    mockGetPaymentHolds([hold])

    const result = await getHolds()
    expect(result[0].canBeRemoved).toBeUndefined()
    expect(result[0].agreementNumber).toBe('All')
    expect(result[0].contractNumber).toBe('All')
  })

  test('Should set canBeRemoved if holdCategorySchemeName is not "BPS" and agreementNumber is missing', async () => {
    const hold = {
      dateTimeClosed: null,
      dateTimeAdded: '2024-08-19T12:34:56Z',
      holdCategorySchemeName: 'LNR',
      marketingYear: '2024',
      agreementNumber: null,
      contractNumber: '123'
    }
    mockGetPaymentHolds([hold])

    const result = await getHolds()
    expect(result[0].canBeRemoved).toBe(true)
    expect(result[0].agreementNumber).toBe('All')
  })

  test('Should set canBeRemoved if marketingYear is missing, regardless of scheme', async () => {
    const hold = {
      dateTimeClosed: null,
      dateTimeAdded: '2024-08-19T12:34:56Z',
      holdCategorySchemeName: 'BPS',
      marketingYear: null,
      agreementNumber: 'A1',
      contractNumber: 'C1'
    }
    mockGetPaymentHolds([hold])

    const result = await getHolds()
    expect(result[0].canBeRemoved).toBe(true)
    expect(result[0].marketingYear).toBe('All')
  })

  test('Should handle missing fields gracefully', async () => {
    const hold = {
      dateTimeClosed: null,
      dateTimeAdded: '2024-08-19T12:34:56Z',
      holdCategorySchemeName: 'SFI'
    }
    mockGetPaymentHolds([hold])

    const result = await getHolds()
    expect(result[0].marketingYear).toBe('All')
    expect(result[0].agreementNumber).toBe('All')
    expect(result[0].contractNumber).toBe('All')
    expect(result[0].canBeRemoved).toBe(true)
  })

  test('Should handle undefined paymentHolds gracefully', async () => {
    getProcessingData.mockResolvedValue({ payload: {} })
    const result = await getHolds()
    expect(result).toBeUndefined()
  })
})
