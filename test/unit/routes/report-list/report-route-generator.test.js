const { get } = require('../../../../app/cache')
const setReportStatus = require('../../../../app/helpers/set-report-status')
const { generateReport } = require('../../../../app/reporting')

jest.mock('../../../../app/cache', () => ({
  get: jest.fn()
}))
jest.mock('../../../../app/helpers/set-report-status', () => jest.fn())
jest.mock('../../../../app/reporting', () => ({
  generateReport: jest.fn()
}))

const HTTP_STATUS = {
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  ACCEPTED: 202
}

const handlerStatus = async (request, h) => {
  const jobId = request.params.jobId
  try {
    const result = await get(request, jobId)
    if (!result) {
      return h.response({ status: 'not-found' }).code(HTTP_STATUS.NOT_FOUND)
    }
    return h.response({ status: result.status })
  } catch (err) {
    console.error('Error fetching report status from cache:', err)
    return h.response({ status: 'failed' }).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

const handlerDownload = async (request, h) => {
  const jobId = request.params.jobId
  const result = await get(request, jobId)
  if (!result || result.status !== 'ready') {
    return h.response('Report not ready').code(HTTP_STATUS.ACCEPTED)
  }
  const { reportType, returnedFilename, reportFilename } = result
  const setStatusCallback = () => {
    setReportStatus(request, jobId, { status: 'completed' })
  }
  const responseStream = await generateReport(returnedFilename, reportType, setStatusCallback)
  console.debug(`Writing response stream to ${reportFilename}.`)
  return h.response(responseStream)
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', `attachment; filename="${reportFilename}"`)
    .header('Transfer-Encoding', 'chunked')
}

const createH = (payload = {}) => {
  return {
    response: (p) => {
      const res = {
        payload: p,
        code: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnThis()
      }
      return res
    }
  }
}

describe('handlerStatus', () => {
  let request, h, consoleErrorSpy

  beforeEach(() => {
    request = { params: { jobId: '123' } }
    h = createH()
    get.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('returns not-found when get returns falsy', async () => {
    get.mockResolvedValue(null)
    const response = await handlerStatus(request, h)
    expect(response.payload).toEqual({ status: 'not-found' })
    expect(response.code).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND)
  })

  test('returns status when get returns valid result', async () => {
    get.mockResolvedValue({ status: 'preparing' })
    const response = await handlerStatus(request, h)
    expect(response.payload).toEqual({ status: 'preparing' })
  })

  test('propagates error and returns failed with 500', async () => {
    const err = new Error('cache err')
    get.mockRejectedValue(err)
    const response = await handlerStatus(request, h)
    expect(console.error).toHaveBeenCalledWith('Error fetching report status from cache:', err)
    expect(response.payload).toEqual({ status: 'failed' })
    expect(response.code).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
  })
})

describe('handlerDownload', () => {
  let request, h, consoleDebugSpy

  beforeEach(() => {
    request = { params: { jobId: '456' } }
    h = createH()
    get.mockReset()
    generateReport.mockReset()
    setReportStatus.mockClear()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleDebugSpy.mockRestore()
  })

  test("returns 'Report not ready' if get returns falsy", async () => {
    get.mockResolvedValue(null)
    const response = await handlerDownload(request, h)
    expect(response.payload).toEqual('Report not ready')
    expect(response.code).toHaveBeenCalledWith(HTTP_STATUS.ACCEPTED)
  })

  test("returns 'Report not ready' if status is not 'ready'", async () => {
    get.mockResolvedValue({ status: 'preparing' })
    const response = await handlerDownload(request, h)
    expect(response.payload).toEqual('Report not ready')
    expect(response.code).toHaveBeenCalledWith(HTTP_STATUS.ACCEPTED)
  })

  test('processes download when status is ready', async () => {
    const fakeResult = {
      status: 'download',
      reportType: 'AP',
      returnedFilename: 'file.csv',
      reportFilename: 'report.csv'
    }
    get.mockResolvedValue(fakeResult)
    const fakeStream = { streamData: true }
    generateReport.mockResolvedValue(fakeStream)
    const response = await handlerDownload(request, h)
    expect(generateReport).toHaveBeenCalled()
    expect(setReportStatus).not.toHaveBeenCalled()
    expect(console.debug).toHaveBeenCalledWith('Writing response stream to report.csv.')
    expect(response.payload).toBe(fakeStream)
    expect(response.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(response.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="report.csv"')
    expect(response.header).toHaveBeenCalledWith('Transfer-Encoding', 'chunked')
  })

  test('calls setReportStatus in setStatusCallback when download is ready', async () => {
    const fakeResult = {
      status: 'download',
      reportType: 'AP',
      returnedFilename: 'file.csv',
      reportFilename: 'report.csv'
    }
    get.mockResolvedValue(fakeResult)
    let callbackFn
    generateReport.mockImplementation((returnedFilename, reportType, setStatusCallback) => {
      callbackFn = setStatusCallback
      return Promise.resolve('streamOutput')
    })
    await handlerDownload(request, h)
    if (callbackFn) callbackFn()
    expect(setReportStatus).toHaveBeenCalledWith(request, '456', { status: 'completed' })
  })
})
