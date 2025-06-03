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

  test('should call set with only required status when errors is undefined', async () => {
    const status = 'processing'
    await setLoadingStatus(request, jobId, { status })

    expect(set).toHaveBeenCalledWith(request, jobId, { status })
  })

  test('should include errors when defined', async () => {
    const status = 'failed'
    const errors = [{ message: 'Test error' }]

    await setLoadingStatus(request, jobId, { status, errors })

    expect(set).toHaveBeenCalledWith(request, jobId, {
      status,
      errors
    })
  })

  test('should merge status and errors correctly when both are defined', async () => {
    const args = {
      status: 'failed',
      errors: [{ message: 'Error 1' }, { message: 'Error 2' }]
    }

    await setLoadingStatus(request, jobId, args)

    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })

  test('should omit errors when undefined', async () => {
    const args = {
      status: 'completed',
      errors: undefined
    }
    const expectedData = {
      status: 'completed'
    }

    await setLoadingStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, expectedData)
  })

  test('should handle empty errors array', async () => {
    const args = {
      status: 'failed',
      errors: []
    }

    await setLoadingStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })
})
