const Hapi = require('@hapi/hapi')
const { get, drop } = require('../../../../app/cache')
const routes = require('../../../../app/routes/loading')

jest.mock('../../../../app/cache')

describe('Loading routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })

    const unauthedRoutes = routes.map(route => ({
      ...route,
      options: { ...route.options, auth: false }
    }))

    server.route(unauthedRoutes)
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /loading/{jobId}', () => {
    const jobId = 'test-123'

    test('returns status when job exists', async () => {
      const mockResult = { status: 'processing' }
      get.mockResolvedValue(mockResult)

      const res = await server.inject({
        method: 'GET',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'processing'
      })
      expect(get).toHaveBeenCalledWith(expect.anything(), jobId)
    })

    test('returns not-found when job does not exist', async () => {
      get.mockResolvedValue(null)

      const res = await server.inject({
        method: 'GET',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'not-found'
      })
      expect(get).toHaveBeenCalledWith(expect.anything(), jobId)
    })

    test('returns error when get fails', async () => {
      const ERROR_MESSAGE = 'Cache error'
      get.mockRejectedValue(new Error(ERROR_MESSAGE))

      const res = await server.inject({
        method: 'GET',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'failed',
        message: ERROR_MESSAGE
      })
      expect(get).toHaveBeenCalledWith(expect.anything(), jobId)
    })

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
      const ERROR_MESSAGE = 'Redis error'

      get.mockRejectedValue(new Error(ERROR_MESSAGE))

      const res = await server.inject({
        method: 'GET',
        url: '/loading/error-job'
      })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({ status: 'failed', message: ERROR_MESSAGE })
    })
  })

  describe('DELETE /loading/{jobId}', () => {
    const jobId = 'test-123'

    test('returns success when job deleted', async () => {
      drop.mockResolvedValue(undefined)

      const res = await server.inject({
        method: 'DELETE',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(200)
      expect(drop).toHaveBeenCalledWith(expect.anything(), jobId)
    })

    test('returns error when drop fails', async () => {
      const ERROR_MESSAGE = 'Cache error'
      drop.mockRejectedValue(new Error(ERROR_MESSAGE))

      const res = await server.inject({
        method: 'DELETE',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'failed' // Fix: Remove "message" if it is not part of the actual response
      })
      expect(drop).toHaveBeenCalledWith(expect.anything(), jobId)
    })
  })
})
