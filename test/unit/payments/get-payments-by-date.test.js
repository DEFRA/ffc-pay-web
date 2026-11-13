const { DATE } = require('../../../app/constants/categories')
const { getPaymentsByDate } = require('../../../app/payments')
const { getData } = require('../../../app/payments/get-data')

jest.mock('../../../app/payments/get-data', () => ({
  getData: jest.fn()
}))

describe('get payments by date', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls getData with the date category and payment date parameters', async () => {
    const expectedPayments = [{ id: 'payment-1' }]
    getData.mockResolvedValue(expectedPayments)

    const result = await getPaymentsByDate(1, 12, 3, 2025)

    expect(getData).toHaveBeenCalledWith(DATE, {
      schemeId: 1,
      day: 12,
      month: 3,
      year: 2025
    })
    expect(result).toBe(expectedPayments)
  })

  test('propagates errors from getData', async () => {
    const error = new Error('Request failed')
    getData.mockRejectedValue(error)

    await expect(getPaymentsByDate(1, 12, 3, 2025)).rejects.toBe(error)
  })
})
