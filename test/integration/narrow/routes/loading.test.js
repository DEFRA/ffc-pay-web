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
      get.mockRejectedValue(new Error('Cache error'))

      const res = await server.inject({
        method: 'GET',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'failed'
      })
      expect(get).toHaveBeenCalledWith(expect.anything(), jobId)
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
      drop.mockRejectedValue(new Error('Cache error'))

      const res = await server.inject({
        method: 'DELETE',
        url: `/loading/${jobId}`
      })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({
        status: 'failed'
      })
      expect(drop).toHaveBeenCalledWith(expect.anything(), jobId)
    })
  })
})
