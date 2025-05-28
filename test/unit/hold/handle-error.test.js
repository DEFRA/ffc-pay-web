const { handleFileError } = require('../../../app/hold/handle-error')
const { getHoldCategories } = require('../../../app/holds')
const { BAD_REQUEST } = require('../../../app/constants/http-status')

jest.mock('../../../app/holds')

describe('handleFileError', () => {
  const h = {
    view: jest.fn(() => ({
      code: jest.fn(() => ({
        takeover: jest.fn()
      }))
    }))
  }

  const mockPaymentHoldCategories = [{
    holdCategoryId: 123,
    name: 'Test Hold',
    schemeName: 'Test Scheme'
  }]

  beforeEach(() => {
    jest.clearAllMocks()
    getHoldCategories.mockResolvedValue({
      schemes: ['Test Scheme'],
      paymentHoldCategories: mockPaymentHoldCategories
    })
  })

  test('should call getHoldCategories', async () => {
    await handleFileError(h)
    expect(getHoldCategories).toHaveBeenCalled()
  })

  test('should render bulk view with correct data', async () => {
    await handleFileError(h)
    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['Test Scheme'],
      paymentHoldCategories: mockPaymentHoldCategories,
      errors: {
        details: [{
          message: 'An error occurred whilst reading the file'
        }]
      }
    })
  })

  test('should set response code to BAD_REQUEST', async () => {
    const codeFn = jest.fn(() => ({ takeover: jest.fn() }))
    h.view.mockReturnValue({ code: codeFn })

    await handleFileError(h)
    expect(codeFn).toHaveBeenCalledWith(BAD_REQUEST)
  })

  test('should call takeover', async () => {
    const takeoverFn = jest.fn()
    h.view.mockReturnValue({
      code: jest.fn(() => ({ takeover: takeoverFn }))
    })

    await handleFileError(h)
    expect(takeoverFn).toHaveBeenCalled()
  })

  test('should handle getHoldCategories error', async () => {
    const error = new Error('Failed to get categories')
    getHoldCategories.mockRejectedValue(error)

    await expect(handleFileError(h)).rejects.toThrow('Failed to get categories')
  })
})
