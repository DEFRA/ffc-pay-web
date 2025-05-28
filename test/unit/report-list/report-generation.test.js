const { Readable } = require('stream')
const routes = require('../../../app/routes/report-list/report-generation')
const { get } = require('../../../app/cache')
const { generateReport } = require('../../../app/reporting')
const setReportStatus = require('../../../app/helpers/set-report-status')

jest.mock('../../../app/cache')
jest.mock('../../../app/reporting')
jest.mock('../../../app/helpers/set-report-status')

const Hapi = require('@hapi/hapi')
const HTTP_STATUS = require('../../../app/constants/http-status')

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

  describe('GET /loading/{jobId}', () => {
    test('returns status from cache if present', async () => {
      get.mockResolvedValue({ status: 'download' })

      const res = await server.inject({
        method: 'GET',
        url: '/loading/test-job'
      })

      expect(res.statusCode).toBe(HTTP_STATUS.SUCCESS)
      expect(JSON.parse(res.payload)).toEqual({ status: 'download' })
    })

    test('returns not-found if cache entry is missing', async () => {
      get.mockResolvedValue(null)

      const res = await server.inject({
        method: 'GET',
        url: '/loading/missing-job'
      })

      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.payload)).toEqual({ status: 'not-found' })
    })

    test('returns failed on cache error', async () => {
      get.mockRejectedValue(new Error('Redis error'))

      const res = await server.inject({
        method: 'GET',
        url: '/loading/error-job'
      })

      expect(res.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(JSON.parse(res.payload)).toEqual({ status: 'failed' })
    })
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
      expect(res.headers['content-type']).toBe('text/csv')
      expect(res.headers['content-disposition']).toBe('attachment; filename="final.csv"')
      expect(res.payload).toContain('some,data')

      expect(setReportStatus).toHaveBeenCalledWith(expect.any(Object), 'job-ready', {
        status: 'completed'
      })
    })
  })
})
