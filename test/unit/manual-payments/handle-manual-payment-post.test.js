const { handleManualPaymentUploadPost } = require('../../../app/manual-payments/handle-manual-payment-post')
const { SUCCESS, CONFLICT, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } = require('../../../app/constants/http-status-codes')
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
  let request, h

  const setupSuccessfulUpload = () => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
  }

  const setupFailedUpload = (code) => {
    readFileContent.mockReturnValue('data')
    isTextWhitespace.mockReturnValue(false)
    uploadManualPaymentFile.mockResolvedValue()
    postInjection.mockRejectedValue({ data: { payload: { statusCode: code } } })
  }

  beforeEach(() => {
    request = {
      payload: { file: { path: '/fake/path', filename: 'file.txt' } },
      auth: { credentials: { account: { name: 'Test User', email: 'test@example.com' } } }
    }
    h = { view: jest.fn() }

    jest.resetAllMocks()
  })

  test('fails if file content is empty or whitespace', async () => {
    readFileContent.mockReturnValue('   ')
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
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: UNPROCESSABLE_CONTENT })
      })
    )
    expect(result).toBe('fail-response')
  })

  test('completes successfully when upload works', async () => {
    setupSuccessfulUpload()
    postInjection.mockResolvedValue({ statusCode: SUCCESS, payload: {} })

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.any(String),
      { status: 'processing' }
    )
    expect(setLoadingStatus).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.any(String),
      { status: 'completed', message: MANUAL_UPLOAD_RESPONSE_MESSAGES[SUCCESS] }
    )
    expect(h.view).toHaveBeenCalledWith(
      MANUAL_PAYMENT_VIEWS.LOADING,
      expect.objectContaining({ jobId: expect.any(String) })
    )
  })

  test.each([
    { code: CONFLICT },
    { code: INTERNAL_SERVER_ERROR },
    { code: UNPROCESSABLE_CONTENT }
  ])('handles backend error code %p correctly', async ({ code }) => {
    setupFailedUpload(code)

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.any(String),
      { status: 'processing' }
    )
    expect(setLoadingStatus).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.any(String),
      {
        status: 'failed',
        message: 'An unexpected problem occurred while processing your file. Please try again later or contact support if the issue persists.'
      }
    )
  })

  test('handles exceptions with no payload gracefully', async () => {
    setupSuccessfulUpload()
    postInjection.mockRejectedValue(new Error('Unexpected error'))

    await handleManualPaymentUploadPost(request, h)

    expect(setLoadingStatus).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.any(String),
      {
        status: 'failed',
        message: 'An unexpected problem occurred while processing your file. Please try again later or contact support if the issue persists.'
      }
    )
  })

  test('logs success message on completed upload', async () => {
    setupSuccessfulUpload()
    postInjection.mockResolvedValue({ statusCode: SUCCESS, payload: {} })
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    await handleManualPaymentUploadPost(request, h)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Manual payment file uploaded successfully',
      MANUAL_UPLOAD_RESPONSE_MESSAGES[SUCCESS]
    )

    consoleLogSpy.mockRestore()
  })

  test('logs failure message on failed upload', async () => {
    setupFailedUpload(INTERNAL_SERVER_ERROR)
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    await handleManualPaymentUploadPost(request, h)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Manual payment file upload failed with code ${INTERNAL_SERVER_ERROR}`,
      expect.any(String)
    )

    consoleLogSpy.mockRestore()
  })
})
