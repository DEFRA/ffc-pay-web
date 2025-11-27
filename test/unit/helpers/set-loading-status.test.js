const { setLoadingStatus } = require('../../../app/helpers/set-loading-status')

jest.mock('../../../app/cache', () => ({
  set: jest.fn()
}))

const { set } = require('../../../app/cache')

describe('setLoadingStatus', () => {
  let request, jobId

  beforeEach(() => {
    request = { dummy: 'request' }
    jobId = 'job-123'
    set.mockClear()
  })

  test('calls set with only status when message is undefined', async () => {
    await setLoadingStatus(request, jobId, { status: 'processing' })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'processing' })
  })

  test('includes message when provided', async () => {
    const message = 'Test error'
    await setLoadingStatus(request, jobId, { status: 'failed', message })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'failed', message })
  })

  test('merges status and array of error messages correctly', async () => {
    const args = { status: 'failed', message: [{ message: 'Error 1' }, { message: 'Error 2' }] }
    await setLoadingStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })

  test('omits message when explicitly undefined', async () => {
    const args = { status: 'completed', message: undefined }
    await setLoadingStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'completed' })
  })

  test('retains empty string message', async () => {
    const args = { status: 'failed', message: '' }
    await setLoadingStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })
})
