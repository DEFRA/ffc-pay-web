const { Readable } = require('stream')
const routes = require('../../../../../app/routes/report-list/report-generation')
const { get } = require('../../../../../app/cache')
const { generateReport } = require('../../../../../app/reporting')
const { setStatusCallback } = require('../../../../../app/reporting/set-status-callback')

jest.mock('../../../../../app/cache')
jest.mock('../../../../../app/reporting')
jest.mock('../../../../../app/reporting/set-status-callback')

const Hapi = require('@hapi/hapi')

describe('Report Generation Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })

    const unauthenticatedRoutes = routes.map(route => ({
      ...route,
      options: { ...route.options, auth: false }
    }))

    server.route(unauthenticatedRoutes)
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /report-list/generation/download/{jobId}', () => {
    test('returns 202 if report not ready', async () => {
      get.mockResolvedValue({ status: 'preparing' })

      const res = await server.inject({
        method: 'GET',
        url: '/report-list/generation/download/job123'
      })

      expect(res.statusCode).toBe(202)
      expect(res.payload).toBe('Report not ready')
    })

    test('returns 500 if generateReport returns null', async () => {
      get.mockResolvedValue({
        status: 'download',
        reportType: 'example-report',
        returnedFilename: 'returned.csv',
        reportFilename: 'final.csv'
      })

      generateReport.mockResolvedValue(null)

      const res = await server.inject({
        method: 'GET',
        url: '/report-list/generation/download/job-failed'
      })

      expect(res.statusCode).toBe(500)
      expect(res.payload).toBe('Report generation failed')
    })

    test('returns streamed CSV with correct headers if report is ready', async () => {
      const fakeStream = new Readable()
      fakeStream._read = () => {}
      fakeStream.push('some,data\n')
      fakeStream.push(null)

      get.mockResolvedValue({
        status: 'download',
        reportType: 'example-report',
        returnedFilename: 'returned.csv',
        reportFilename: 'final.csv'
      })

      generateReport.mockResolvedValue(fakeStream)

      const res = await server.inject({
        method: 'GET',
        url: '/report-list/generation/download/job-ready'
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
      expect(res.headers['content-disposition']).toBe('attachment; filename="final.csv"')
      expect(res.payload).toContain('some,data')
    })

    test('calls setStatusCallback with correct parameters', async () => {
      const fakeStream = new Readable()
      fakeStream._read = () => {}
      fakeStream.push('some,data\n')
      fakeStream.push(null)

      get.mockResolvedValue({
        status: 'download',
        reportType: 'example-report',
        returnedFilename: 'returned.csv',
        reportFilename: 'final.csv'
      })

      const mockCallback = jest.fn()
      setStatusCallback.mockImplementation(() => {
        console.log('setStatusCallback called')
        return mockCallback
      })

      generateReport.mockImplementation((filename, reportType, onComplete) => {
        console.log('generateReport called')
        onComplete()
        return fakeStream
      })

      await server.inject({
        method: 'GET',
        url: '/report-list/generation/download/job-callback'
      })

      expect(setStatusCallback).toHaveBeenCalledWith(expect.any(Object), 'job-callback')
      expect(mockCallback).toHaveBeenCalled()
    })
  })
})
