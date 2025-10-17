const { manualPaymentUploadFailAction } = require('../../../app/manual-payments/manual-payment-fail-action')
const MANUAL_PAYMENT_VIEWS = require('../../../app/constants/manual-payment-views')
const HTTP_STATUS = require('../../../app/constants/http-status-codes')
const { MAX_MEGA_BYTES } = require('../../../app/constants/payload-sizes')

jest.mock('../../../app/manual-payments/manual-payment-upload-history', () => ({
  getManualPaymentUploadHistory: jest.fn().mockResolvedValue([])
}))

describe('manualPaymentUploadFailAction', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      payload: { crumb: 'payload-crumb' },
      state: { crumb: 'state-crumb' }
    }

    h = {
      view: jest.fn(() => h),
      code: jest.fn(() => h),
      takeover: jest.fn()
    }

    jest.clearAllMocks()
  })

  test('should handle CONTENT_TOO_LARGE (413) error and return correct view', async () => {
    const error = {
      output: {
        statusCode: HTTP_STATUS.CONTENT_TOO_LARGE
      }
    }

    await manualPaymentUploadFailAction(request, h, error)

    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
      errors: {
        details: [
          {
            path: 'payload',
            message: `File too large - The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`
          }
        ]
      },
      crumb: 'payload-crumb',
      uploadHistory: []
    })
    expect(h.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should handle generic error and return correct view', async () => {
    const error = { message: 'Some error' }

    await manualPaymentUploadFailAction(request, h, error)

    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
      errors: error,
      crumb: 'payload-crumb',
      uploadHistory: []
    })
    expect(h.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should use state crumb if payload crumb is missing', async () => {
    const requestWithoutPayloadCrumb = {
      state: { crumb: 'state-crumb' }
    }
    const error = { message: 'Test error' }

    await manualPaymentUploadFailAction(requestWithoutPayloadCrumb, h, error)

    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
      errors: error,
      crumb: 'state-crumb',
      uploadHistory: []
    })
    expect(h.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  })
})
