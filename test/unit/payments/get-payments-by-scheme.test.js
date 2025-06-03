jest.mock('../../../app/payments/get-data')
const { getData: mockGetData } = require('../../../app/payments/get-data')
const { DATA } = require('../../mocks/values/data')
const { SCHEME_ID: SCHEME_ID_CATEGORY } = require('../../../app/constants/categories')

const SCHEME_VALUE = 'default'

const { getPaymentsByScheme } = require('../../../app/payments')

describe('get payments by scheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetData.mockResolvedValue(DATA)
  })

  test('should call mockGetData with schemeId category and scheme value', async () => {
    await getPaymentsByScheme(SCHEME_VALUE)
    expect(mockGetData).toHaveBeenCalledWith(SCHEME_ID_CATEGORY, SCHEME_VALUE)
  })

  test('should return mock payment events data when getPaymentsByScheme is called', async () => {
    const result = await getPaymentsByScheme(SCHEME_VALUE)
    expect(result).toEqual(DATA)
  })
})
