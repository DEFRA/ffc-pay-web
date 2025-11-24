const { manualPaymentUploadFailAction } = require('../../../app/manual-payments/manual-payment-fail-action')
const MANUAL_PAYMENT_VIEWS = require('../../../app/constants/manual-payment-views')
const HTTP_STATUS = require('../../../app/constants/http-status-codes')
const { MAX_MEGA_BYTES } = require('../../../app/constants/payload-sizes')

jest.mock('../../../app/manual-payments/get-manual-payment-upload-history', () => ({
  getManualPaymentUploadHistory: jest.fn().mockResolvedValue([])
}))

describe('manualPaymentUploadFailAction', () => {
  let request, h

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

  const expectHapiResponse = async (expectedErrors, crumb = 'payload-crumb') => {
    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.MANUAL_PAYMENTS, {
      errors: expectedErrors,
      crumb,
      uploadHistory: []
    })
    expect(h.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
    expect(h.takeover).toHaveBeenCalled()
  }

  test('handles CONTENT_TOO_LARGE (413) error', async () => {
    const error = { output: { statusCode: HTTP_STATUS.CONTENT_TOO_LARGE } }

    await manualPaymentUploadFailAction(request, h, error)

    const expectedErrors = {
      details: [
        {
          path: 'payload',
          message: `File too large - The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`
        }
      ]
    }

    await expectHapiResponse(expectedErrors)
  })

  test('handles generic error', async () => {
    const error = { message: 'Some error' }

    await manualPaymentUploadFailAction(request, h, error)

    await expectHapiResponse(error)
  })

  test('falls back to state crumb if payload crumb is missing', async () => {
    const error = { message: 'Test error' }
    const requestWithoutPayloadCrumb = { state: { crumb: 'state-crumb' } }

    await manualPaymentUploadFailAction(requestWithoutPayloadCrumb, h, error)

    await expectHapiResponse(error, 'state-crumb')
  })
})
