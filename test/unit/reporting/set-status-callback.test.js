const setReportStatus = require('../../../app/helpers/set-report-status')
const { setStatusCallback } = require('../../../app/reporting/set-status-callback')

jest.mock('../../../app/helpers/set-report-status')

describe('setStatusCallback', () => {
  let request, jobId, callback

  beforeEach(() => {
    request = { params: { jobId: 'test-job-id' } }
    jobId = 'test-job-id'
    callback = setStatusCallback(request, jobId)
    jest.clearAllMocks()
  })

  test('calls setReportStatus with failed status and error message when errorMessage is provided', async () => {
    const errorMessage = 'Test error message'

    await callback(errorMessage)

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'failed',
      message: errorMessage
    })
  })

  test('calls setReportStatus with failed status and default error message when errorMessage is empty', async () => {
    const emptyMessage = ''

    await callback(emptyMessage)

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'failed',
      message: 'An error occurred while generating the report.'
    })
  })

  test('calls setReportStatus with completed status when errorMessage is null', async () => {
    await callback()

    expect(setReportStatus).toHaveBeenCalledWith(request, jobId, {
      status: 'completed'
    })
  })
})
