const { bulkFailAction } = require('../../../app/helpers/bulk-fail-action')
const { getHoldCategories } = require('../../../app/holds')

jest.mock('../../../app/holds')

describe('bulkFailAction', () => {
  const request = {
    payload: {
      crumb: 'test-crumb'
    },
    state: {
      crumb: 'state-crumb'
    }
  }

  const h = {
    view: jest.fn(() => h),
    code: jest.fn(() => h),
    takeover: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getHoldCategories.mockResolvedValue({
      schemes: ['scheme1'],
      paymentHoldCategories: ['category1']
    })
  })

  test('should handle 413 error and return correct view', async () => {
    const error = {
      output: {
        statusCode: 413
      }
    }

    await bulkFailAction(request, h, error)

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['scheme1'],
      paymentHoldCategories: ['category1'],
      errors: {
        details: [{
          message: 'The uploaded file is too large. Please upload a file smaller than 1 MB.'
        }]
      },
      crumb: 'test-crumb'
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should handle generic error and return correct view', async () => {
    const error = {
      message: 'Test error'
    }

    await bulkFailAction(request, h, error)

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['scheme1'],
      paymentHoldCategories: ['category1'],
      errors: error,
      crumb: 'test-crumb'
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should use state crumb when payload crumb is missing', async () => {
    const requestWithoutPayloadCrumb = {
      state: {
        crumb: 'state-crumb'
      }
    }

    await bulkFailAction(requestWithoutPayloadCrumb, h, {})

    expect(h.view).toHaveBeenCalledWith('payment-holds/bulk', {
      schemes: ['scheme1'],
      paymentHoldCategories: ['category1'],
      errors: {},
      crumb: 'state-crumb'
    })
  })
})
