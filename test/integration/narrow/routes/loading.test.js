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

  const jobId = 'test-123'

  describe('GET /loading/{jobId}', () => {
    const cases = [
      { desc: 'returns status when job exists', mock: { status: 'processing' }, expected: { status: 'processing' }, code: 200 },
      { desc: 'returns not-found when job does not exist', mock: null, expected: { status: 'not-found' }, code: 404 },
      { desc: 'returns failed on cache error', mock: new Error('Cache error'), expected: { status: 'failed', message: 'Cache error' }, code: 500 }
    ]

    cases.forEach(({ desc, mock, expected, code }) => {
      test(desc, async () => {
        if (mock instanceof Error) get.mockRejectedValue(mock)
        else get.mockResolvedValue(mock)

        const res = await server.inject({ method: 'GET', url: `/loading/${jobId}` })

        expect(res.statusCode).toBe(code)
        expect(JSON.parse(res.payload)).toEqual(expected)
        expect(get).toHaveBeenCalledWith(expect.anything(), jobId)
      })
    })
  })

  describe('DELETE /loading/{jobId}', () => {
    test('returns success when job deleted', async () => {
      drop.mockResolvedValue(undefined)

      const res = await server.inject({ method: 'DELETE', url: `/loading/${jobId}` })

      expect(res.statusCode).toBe(200)
      expect(drop).toHaveBeenCalledWith(expect.anything(), jobId)
    })

    test('returns failed when drop fails', async () => {
      drop.mockRejectedValue(new Error('Cache error'))

      const res = await server.inject({ method: 'DELETE', url: `/loading/${jobId}` })

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.payload)).toEqual({ status: 'failed' })
      expect(drop).toHaveBeenCalledWith(expect.anything(), jobId)
    })
  })
})
