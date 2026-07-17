const setReportStatus = require('../../../app/helpers/set-report-status')
const { setStatusCallback } = require('../../../app/reporting/set-status-callback')

jest.mock('../../../app/helpers/set-report-status')

describe('setStatusCallback', () => {
  let request, jobId

  beforeEach(() => {
    request = { params: { jobId: 'test-job-id' } }
    jobId = 'test-job-id'
    jest.clearAllMocks()
  })

  test('calls setReportStatus with failed status and error message when errorMessage is provided', async () => {
    const callback = setStatusCallback(request, jobId)
    const errorMessage = 'Test error message'

    await callback(errorMessage)

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'failed',
      message: errorMessage
    })
  })

  test('calls setReportStatus with failed status and default error message when errorMessage is empty', async () => {
    const callback = setStatusCallback(request, jobId)
    const emptyMessage = ''

    await callback(emptyMessage)

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'failed',
      message: 'An error occurred while generating the report.'
    })
  })

  test('calls setReportStatus with completed status when errorMessage is null', async () => {
    const callback = setStatusCallback(request, jobId)
    await callback()

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'completed'
    })
  })

  test('calls setReportStatus with no-results status when statusOverride is no-results', async () => {
    const callback = setStatusCallback(request, jobId)
    await callback(null, 'no-results')

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'no-results'
    })
  })
})
