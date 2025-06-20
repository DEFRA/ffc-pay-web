const { processUpload } = require('../../../app/hold/process-upload')
const { post } = require('../../../app/api')
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
    post.mockResolvedValue({})
    setLoadingStatus.mockResolvedValue({ status: 'completed' })
  })

  test('should call post with add endpoint when remove is false', async () => {
    await processUpload(request, jobId, uploadData)

    expect(post).toHaveBeenCalledWith(
      '/payment-holds/bulk/add',
      {
        data: uploadData,
        holdCategoryId: '124'
      },
      null
    )
  })

  test('should call post with remove endpoint when remove is true', async () => {
    request.payload.remove = true

    await processUpload(request, jobId, uploadData)

    expect(post).toHaveBeenCalledWith(
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

  test('should throw error when post fails', async () => {
    const error = new Error('API error')
    post.mockRejectedValue(error)

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

    expect(post).toHaveBeenCalledWith(
      expect.any(String),
      expectedPayload,
      null
    )
  })
})
