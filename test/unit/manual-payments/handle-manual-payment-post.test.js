const { handleManualPaymentUploadPost } = require('../../../app/manual-payments/handle-manual-payment-post')
const { SUCCESS, CONFLICT, UNPROCESSABLE_CONTENT } = require('../../../app/constants/http-status-codes')
const MANUAL_PAYMENT_VIEWS = require('../../../app/constants/manual-payment-views')
const MANUAL_UPLOAD_RESPONSE_MESSAGES = require('../../../app/constants/manual-payment-response-messages')

jest.mock('../../../app/helpers/read-file-content')
jest.mock('../../../app/helpers/set-loading-status')
jest.mock('../../../app/storage')
jest.mock('../../../app/api')
jest.mock('../../../app/manual-payments/manual-payment-fail-action')
jest.mock('../../../app/helpers/is-text-whitespace')

const { readFileContent } = require('../../../app/helpers/read-file-content')
const { setLoadingStatus } = require('../../../app/helpers/set-loading-status')
const { uploadManualPaymentFile } = require('../../../app/storage')
const { postInjection } = require('../../../app/api')
const { manualPaymentUploadFailAction } = require('../../../app/manual-payments/manual-payment-fail-action')
const { isTextWhitespace } = require('../../../app/helpers/is-text-whitespace')

describe('handleManualPaymentUploadPost', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      payload: { file: { path: '/fake/path', filename: 'file.txt' } },
      auth: { credentials: { account: { name: 'Test User', email: 'test@example.com' } } }
    }
    h = { view: jest.fn() }

    readFileContent.mockReset()
    setLoadingStatus.mockReset()
    uploadManualPaymentFile.mockReset()
    postInjection.mockReset()
    manualPaymentUploadFailAction.mockReset()
    isTextWhitespace.mockReset()
  })

  test('should fail if file content is empty or whitespace', async () => {
    readFileContent.mockReturnValue('   ') // whitespace
    isTextWhitespace.mockReturnValue(true)
    manualPaymentUploadFailAction.mockResolvedValue('fail-response')

    const result = await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), {
      status: 'failed',
      message: 'File empty'
    })
    expect(manualPaymentUploadFailAction).toHaveBeenCalledWith(
      request,
      h,
      expect.objectContaining({ isBoom: true, output: { statusCode: UNPROCESSABLE_CONTENT } })
    )
    expect(result).toBe('fail-response')
  })

  test('should complete successfully when upload works', async () => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockResolvedValue({ statusCode: SUCCESS, payload: {} })

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), { status: 'processing' })
    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), {
      status: 'completed',
      message: MANUAL_UPLOAD_RESPONSE_MESSAGES[SUCCESS]
    })
    expect(h.view).toHaveBeenCalledWith(MANUAL_PAYMENT_VIEWS.LOADING, expect.objectContaining({ jobId: expect.any(String) }))
  })

  test('should handle backend error codes correctly', async () => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockRejectedValue({ data: { payload: { statusCode: CONFLICT } } })

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), {
      status: 'failed',
      message: MANUAL_UPLOAD_RESPONSE_MESSAGES[CONFLICT]
    })
  })

  test('should handle unknown backend errors gracefully', async () => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockRejectedValue({ message: 'Short backend msg' })

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), {
      status: 'failed',
      message: 'Short backend msg'
    })
  })

  test('should handle exceptions with no payload', async () => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockRejectedValue(new Error('Unexpected error'))

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenCalledWith(expect.anything(), expect.any(String), {
      status: 'failed',
      message: 'Unexpected error'
    })
  })
})
