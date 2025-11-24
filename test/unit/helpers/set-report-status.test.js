const setReportStatus = require('../../../app/helpers/set-report-status')

jest.mock('../../../app/cache', () => ({
  set: jest.fn()
}))

const { set } = require('../../../app/cache')

describe('setReportStatus', () => {
  let request, jobId

  beforeEach(() => {
    request = { dummy: 'request' }
    jobId = 'job-123'
    set.mockClear()
  })

  test('calls set with only required status when optional values are undefined', async () => {
    await setReportStatus(request, jobId, { status: 'pending' })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'pending' })
  })

  test('includes individual optional values when provided', async () => {
    await setReportStatus(request, jobId, { status: 'done', returnedFilename: 'returned.csv' })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'done', returnedFilename: 'returned.csv' })

    await setReportStatus(request, jobId, { status: 'done', reportFilename: 'report.csv' })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'done', reportFilename: 'report.csv' })

    await setReportStatus(request, jobId, { status: 'done', reportType: 'pdf' })
    expect(set).toHaveBeenCalledWith(request, jobId, { status: 'done', reportType: 'pdf' })
  })

  test('merges all optional values correctly when all are defined', async () => {
    const args = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportFilename: 'report.csv',
      reportType: 'pdf'
    }

    await setReportStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })

  test('omits optional keys that are undefined', async () => {
    const args = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportFilename: undefined,
      reportType: 'pdf'
    }
    const expectedData = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportType: 'pdf'
    }

    await setReportStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, expectedData)
  })
})
