const { handleManualPaymentPost } = require('../../../app/manual-payments/handle-manual-payment-post')
const { SUCCESS, CONFLICT } = require('../../../app/constants/http-status-codes')
const MANUAL_PAYMENT_VIEWS = require('../../../app/constants/manual-payment-views')
const MANUAL_UPLOAD_RESPONSE_MESSAGES = require('../../../app/constants/manual-upload-response-messages')

jest.mock('../../../app/helpers/read-file-content')
jest.mock('../../../app/helpers/set-loading-status')
jest.mock('../../../app/storage')
jest.mock('../../../app/api')
jest.mock('../../../app/manual-payments/manual-upload-fail-action')

const { readFileContent } = require('../../../app/helpers/read-file-content')
const { setLoadingStatus } = require('../../../app/helpers/set-loading-status')
const { uploadManualPaymentFile } = require('../../../app/storage')
const { postInjection } = require('../../../app/api')
const { manualUploadFailAction } = require('../../../app//manual-payments/manual-upload-fail-action')

describe('handleManualPaymentPost', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      payload: { file: { path: '/fake/path', filename: 'file.txt' } },
      auth: { credentials: { name: 'Test User', email: 'test@example.com' } }
    }
    h = { view: jest.fn() }
    readFileContent.mockReset()
    setLoadingStatus.mockReset()
    uploadManualPaymentFile.mockReset()
    postInjection.mockReset()
    manualUploadFailAction.mockReset()
  })

  test('should fail if file content is empty', async () => {
    readFileContent.mockReturnValue(null)
    manualUploadFailAction.mockReturnValue('fail-response')

    const result = await handleManualPaymentPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'failed',
      message: 'File empty'
    })
    expect(result).toBe('fail-response')
    expect(manualUploadFailAction).toHaveBeenCalledWith(h)
  })

  test('should complete successfully when upload works', async () => {
    readFileContent.mockReturnValue('data')
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockResolvedValue({ statusCode: 200, payload: { code: SUCCESS } })

    await handleManualPaymentPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'processing',
      message: undefined
    })
    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'completed',
      message: MANUAL_UPLOAD_RESPONSE_MESSAGES[SUCCESS]
    })
    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.LOADING, expect.objectContaining({ jobId: expect.any(String) }))
  })

  test('should handle backend error codes correctly', async () => {
    readFileContent.mockReturnValue('data')
    uploadManualPaymentFile.mockResolvedValue()
    const mockError = { data: { res: { statusCode: CONFLICT } } }
    postInjection.mockRejectedValue(mockError)

    await handleManualPaymentPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'failed',
      message: MANUAL_UPLOAD_RESPONSE_MESSAGES[CONFLICT]
    })
  })

  test('should handle unknown backend errors gracefully', async () => {
    readFileContent.mockReturnValue('data')
    uploadManualPaymentFile.mockResolvedValue()
    const mockError = { data: { payload: { code: 'UNKNOWN_CODE', message: 'Short backend msg' } } }
    postInjection.mockRejectedValue(mockError)

    await handleManualPaymentPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'failed',
      message: 'Short backend msg'
    })
  })

  test('should handle exceptions with no payload', async () => {
    readFileContent.mockReturnValue('data')
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockRejectedValue(new Error('Network error'))

    await handleManualPaymentPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      status: 'failed',
      message: 'Network error'
    })
  })
})
