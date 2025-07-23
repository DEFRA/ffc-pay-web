const Hapi = require('@hapi/hapi')
const routes = require('../../../../../app/routes/report-list/status-report')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const { getValidReportYears, getReportsByYearAndType } = require('../../../../../app/storage/doc-reports')
const { mapStatusReportsToTaskList } = require('../../../../../app/helpers/map-status-report-to-task-list')
const { handleStreamResponse } = require('../../../../../app/helpers')

jest.mock('../../../../../app/storage/doc-reports', () => ({
  getValidReportYears: jest.fn(),
  getReportsByYearAndType: jest.fn(),
  getStatusReport: jest.fn()
}))

jest.mock('../../../../../app/helpers/map-status-report-to-task-list')
jest.mock('../../../../../app/helpers')

describe('Status Report Integration Tests', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })

    server.decorate('toolkit', 'view', function (viewName, context) {
      return { statusCode: 200, viewName, context }
    })

    const routesWithoutAuth = routes.map(route => ({
      ...route,
      options: { ...route.options, auth: false } // don't use auth
    }))

    server.route(routesWithoutAuth)
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /status returns years view', async () => {
    getValidReportYears.mockResolvedValue([2022, 2023])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS
    })

    expect(res.statusCode).toBe(200)
    expect(getValidReportYears).toHaveBeenCalled()
    expect(res.result.context).toEqual({ years: [2022, 2023] })
    expect(res.result.viewName).toBe('report-list/status-report')
  })

  test('GET /status-search returns report results', async () => {
    getReportsByYearAndType.mockResolvedValue([{ filename: 'report.csv' }])
    mapStatusReportsToTaskList.mockReturnValue([{ text: 'Download', href: '/link' }])

    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.STATUS_SEARCH}?select-type=delinked-payment-statement&report-year=2024`
    })

    expect(res.statusCode).toBe(200)
    expect(getReportsByYearAndType).toHaveBeenCalledWith('2024', 'delinked-payment-statement')
    expect(mapStatusReportsToTaskList).toHaveBeenCalledWith([{ filename: 'report.csv' }])
    expect(res.result.context.reportTitle).toContain('Delinked Status Reports - 2024')
    expect(res.result.viewName).toBe('report-list/status-report-results')
  })

  test('GET /status-download returns file stream via handleStreamResponse', async () => {
    handleStreamResponse.mockImplementation(async (_getter, filename, h) => h.response(`File:${filename}`).code(200))

    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=report-file.csv`
    })

    expect(handleStreamResponse).toHaveBeenCalledWith(expect.any(Function), 'report-file.csv', expect.any(Object))
    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('File:report-file.csv')
  })

  test('GET /status-search returns 500 on error', async () => {
    getReportsByYearAndType.mockRejectedValue(new Error('DB Error'))

    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.STATUS_SEARCH}?select-type=any-type&report-year=2024`
    })

    expect(res.statusCode).toBe(500)
  })

  test('GET /status-download returns 500 on stream error', async () => {
    handleStreamResponse.mockRejectedValue(new Error('Stream Error'))

    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=bad-file.csv`
    })

    expect(res.statusCode).toBe(500)
  })
})
