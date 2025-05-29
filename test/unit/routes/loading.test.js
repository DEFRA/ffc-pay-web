const routes = require('../../../app/routes/loading')
const { get } = require('../../../app/cache')

jest.mock('../../../app/cache')
jest.mock('../../../app/reporting')
jest.mock('../../../app/helpers/set-report-status')

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

  describe('GET /loading/{jobId}', () => {
    test('returns status from cache if present', async () => {
      get.mockResolvedValue({ status: 'download' })

      const res = await server.inject({
        method: 'GET',
        url: '/loading/test-job'
      })

      expect(res.statusCode).toBe(200)
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

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({ status: 'failed' })
    })
  })
})
