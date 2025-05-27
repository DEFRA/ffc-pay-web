const setReportStatus = require('../../../app/helpers/set-report-status')

// Mock the cache module and its "set" function.
jest.mock('../../../app/cache', () => ({
  set: jest.fn()
}))

const { set } = require('../../../app/cache')

describe('setReportStatus', () => {
  let request, jobId

  beforeEach(() => {
    // Create a dummy request object and jobId.
    request = { dummy: 'request' }
    jobId = 'job-123'
    // Clear mock before each test.
    set.mockClear()
  })

  test('should call set with only required status when optional values are undefined', async () => {
    const status = 'pending'
    // Call without optional values (implicitly undefined)
    await setReportStatus(request, jobId, { status })

    // Expected data only has status.
    expect(set).toHaveBeenCalledWith(request, jobId, { status })
  })

  test('should include returnedFilename when defined', async () => {
    const status = 'done'
    const returnedFilename = 'returned.csv'

    await setReportStatus(request, jobId, { status, returnedFilename })

    expect(set).toHaveBeenCalledWith(request, jobId, {
      status,
      returnedFilename
    })
  })

  test('should include reportFilename when defined', async () => {
    const status = 'done'
    const reportFilename = 'report.csv'

    await setReportStatus(request, jobId, { status, reportFilename })

    expect(set).toHaveBeenCalledWith(request, jobId, {
      status,
      reportFilename
    })
  })

  test('should include reportType when defined', async () => {
    const status = 'done'
    const reportType = 'pdf'

    await setReportStatus(request, jobId, { status, reportType })

    expect(set).toHaveBeenCalledWith(request, jobId, {
      status,
      reportType
    })
  })

  test('should merge all optional values correctly when all are defined', async () => {
    const args = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportFilename: 'report.csv',
      reportType: 'pdf'
    }

    await setReportStatus(request, jobId, args)

    expect(set).toHaveBeenCalledWith(request, jobId, args)
  })

  test('should omit any optional keys that are undefined', async () => {
    // Some values undefined and some defined.
    const args = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportFilename: undefined,
      reportType: 'pdf'
    }
    // Expected data: reportFilename should not appear.
    const expectedData = {
      status: 'completed',
      returnedFilename: 'returned.csv',
      reportType: 'pdf'
    }

    await setReportStatus(request, jobId, args)
    expect(set).toHaveBeenCalledWith(request, jobId, expectedData)
  })
})
