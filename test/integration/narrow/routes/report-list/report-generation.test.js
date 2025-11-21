const { Readable } = require('stream')
const Hapi = require('@hapi/hapi')
const routes = require('../../../../../app/routes/report-list/report-generation')
const { get } = require('../../../../../app/cache')
const { generateReport } = require('../../../../../app/reporting')
const { setStatusCallback } = require('../../../../../app/reporting/set-status-callback')

jest.mock('../../../../../app/cache')
jest.mock('../../../../../app/reporting')
jest.mock('../../../../../app/reporting/set-status-callback')

describe('Report Generation Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => { await server.stop() })

  const createFakeStream = content => {
    const stream = new Readable()
    stream._read = () => {}
    stream.push(content)
    stream.push(null)
    return stream
  }

  test('GET download returns 202 if report not ready', async () => {
    get.mockResolvedValue({ status: 'preparing' })
    const res = await server.inject({ method: 'GET', url: '/report-list/generation/download/job123' })
    expect(res.statusCode).toBe(202)
    expect(res.payload).toBe('Report not ready')
  })

  test('returns 500 if generateReport fails', async () => {
    get.mockResolvedValue({ status: 'download', reportType: 'example', returnedFilename: 'returned.csv', reportFilename: 'final.csv' })
    generateReport.mockResolvedValue(null)
    const res = await server.inject({ method: 'GET', url: '/report-list/generation/download/job-failed' })
    expect(res.statusCode).toBe(500)
    expect(res.payload).toBe('Report generation failed')
  })

  test('streams CSV if report is ready', async () => {
    const fakeStream = createFakeStream('some,data\n')
    get.mockResolvedValue({ status: 'download', reportType: 'example', returnedFilename: 'returned.csv', reportFilename: 'final.csv' })
    generateReport.mockResolvedValue(fakeStream)
    const res = await server.inject({ method: 'GET', url: '/report-list/generation/download/job-ready' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toBe('attachment; filename="final.csv"')
    expect(res.payload).toContain('some,data')
  })

  test('calls setStatusCallback correctly', async () => {
    const fakeStream = createFakeStream('some,data\n')
    get.mockResolvedValue({ status: 'download', reportType: 'example', returnedFilename: 'returned.csv', reportFilename: 'final.csv' })
    const mockCallback = jest.fn()
    setStatusCallback.mockReturnValue(mockCallback)
    generateReport.mockImplementation((filename, type, onComplete) => { onComplete(); return fakeStream })
    await server.inject({ method: 'GET', url: '/report-list/generation/download/job-callback' })
    expect(setStatusCallback).toHaveBeenCalledWith(expect.any(Object), 'job-callback')
    expect(mockCallback).toHaveBeenCalled()
  })
})
