const { processUpload } = require('../../../app/hold/process-upload')
const { postProcessing } = require('../../../app/api')
const { setLoadingStatus } = require('../../../app/helpers/set-loading-status')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers/set-loading-status')

describe('processUpload', () => {
  let request
  const jobId = '123-456'
  const uploadData = ['1234567890']

  beforeEach(() => {
    jest.clearAllMocks()
    request = {
      payload: {
        remove: false,
        holdCategoryId: '124'
      }
    }
    postProcessing.mockResolvedValue({})
    setLoadingStatus.mockResolvedValue({ status: 'completed' })
  })

  test('should call postProcessing with add endpoint when remove is false', async () => {
    await processUpload(request, jobId, uploadData)

    expect(postProcessing).toHaveBeenCalledWith(
      '/payment-holds/bulk/add',
      {
        data: uploadData,
        holdCategoryId: '124'
      },
      null
    )
  })

  test('should call postProcessing with remove endpoint when remove is true', async () => {
    request.payload.remove = true

    await processUpload(request, jobId, uploadData)

    expect(postProcessing).toHaveBeenCalledWith(
      '/payment-holds/bulk/remove',
      {
        data: uploadData,
        holdCategoryId: '124'
      },
      null
    )
  })

  test('should set loading status to completed after successful upload', async () => {
    await processUpload(request, jobId, uploadData)

    expect(setLoadingStatus).toHaveBeenCalledWith(
      request,
      jobId,
      { status: 'completed' }
    )
  })

  test('should throw error when postProcessing fails', async () => {
    const error = new Error('API error')
    postProcessing.mockRejectedValue(error)

    await expect(processUpload(request, jobId, uploadData))
      .rejects
      .toThrow('API error')
  })

  test('should throw error when setLoadingStatus fails', async () => {
    const error = new Error('Status update failed')
    setLoadingStatus.mockRejectedValue(error)

    await expect(processUpload(request, jobId, uploadData))
      .rejects
      .toThrow('Status update failed')
  })

  test('should pass correct payload structure', async () => {
    const expectedPayload = {
      data: uploadData,
      holdCategoryId: '124'
    }

    await processUpload(request, jobId, uploadData)

    expect(postProcessing).toHaveBeenCalledWith(
      expect.any(String),
      expectedPayload,
      null
    )
  })
})
