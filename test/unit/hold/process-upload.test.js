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
    request = { payload: { remove: false, holdCategoryId: '124' } }
    postProcessing.mockResolvedValue({})
    setLoadingStatus.mockResolvedValue({ status: 'completed' })
  })

  const runTestForRemoveFlag = (removeFlag, expectedEndpoint) => {
    test(`calls postProcessing with ${expectedEndpoint} endpoint when remove=${removeFlag}`, async () => {
      request.payload.remove = removeFlag
      await processUpload(request, jobId, uploadData)
      expect(postProcessing).toHaveBeenCalledWith(
        expectedEndpoint,
        { data: uploadData, holdCategoryId: '124' },
        null
      )
    })
  }

  runTestForRemoveFlag(false, '/payment-holds/bulk/add')
  runTestForRemoveFlag(true, '/payment-holds/bulk/remove')

  test('sets loading status to completed after successful upload', async () => {
    await processUpload(request, jobId, uploadData)
    expect(setLoadingStatus).toHaveBeenCalledWith(request, jobId, { status: 'completed' })
  })

  test.each([
    ['postProcessing fails', postProcessing, 'API error'],
    ['setLoadingStatus fails', setLoadingStatus, 'Status update failed']
  ])('throws error when %s', async (_, fn, message) => {
    fn.mockRejectedValue(new Error(message))
    await expect(processUpload(request, jobId, uploadData)).rejects.toThrow(message)
  })

  test('passes correct payload structure', async () => {
    await processUpload(request, jobId, uploadData)
    expect(postProcessing).toHaveBeenCalledWith(
      expect.any(String),
      { data: uploadData, holdCategoryId: '124' },
      null
    )
  })
})
