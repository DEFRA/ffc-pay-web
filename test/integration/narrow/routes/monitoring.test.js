jest.mock('../../../../app/auth')
jest.mock('../../../../app/payments')

const {
  getPaymentsByFrn: mockGetPaymentsByFrn,
  getPaymentsByCorrelationId: mockGetPaymentsByCorrelationId,
  getPaymentsByBatch: mockGetPaymentsByBatch,
  getPaymentsByScheme: mockGetPaymentsByScheme
} = require('../../../../app/payments')

const { DATA } = require('../../../mocks/values/data')
const { holdAdmin } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')

let server
let auth

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin] } }

  mockGetPaymentsByCorrelationId.mockResolvedValue(DATA)
  mockGetPaymentsByFrn.mockResolvedValue(DATA)
  mockGetPaymentsByBatch.mockResolvedValue(DATA)
  mockGetPaymentsByScheme.mockResolvedValue(DATA)

  server = await createServer()
  await server.initialize()
})

afterEach(async () => { await server.stop() })

const testRoute = (url, viewText = 'Monitoring') => {
  test(`${url} returns 403 if user not in role`, async () => {
    auth.credentials.scope = []
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.statusCode).toBe(403)
  })

  test(`${url} redirects to login if no auth`, async () => {
    const res = await server.inject({ method: 'GET', url })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/login')
  })

  test(`${url} returns 200 if authorised`, async () => {
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.statusCode).toBe(200)
  })

  test(`${url} returns view containing '${viewText}'`, async () => {
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.payload).toContain(viewText)
  })
}

describe('Monitoring routes', () => {
  ['/monitoring',
    '/monitoring/payments/correlation-id',
    '/monitoring/view-processed-payment-requests'
  ].forEach(path => {
    testRoute(path, path.includes('processed') ? 'processed payment requests' : 'Monitoring')
  })

  describe('/monitoring route specific tests', () => {
    test('GET /monitoring returns error message in view when error query is present', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/monitoring?error=true',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('Exactly one of FRN and batch name should be provided')
    })
  })

  describe('/monitoring/payments/frn route specific tests', () => {
    test('GET /monitoring/payments/frn redirects to /monitoring?error=true if frn query param is missing', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/monitoring/payments/frn',
        auth
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/monitoring?error=true')
    })

    test('GET /monitoring/payments/frn returns view with payments when frn query param is provided', async () => {
      mockGetPaymentsByFrn.mockResolvedValue(DATA)

      const res = await server.inject({
        method: 'GET',
        url: '/monitoring/payments/frn?frn=123456',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('123456')
      expect(res.payload).toContain('Monitoring')
    })
  })

  describe('/monitoring/batch/name route specific tests', () => {
    test('GET /monitoring/batch/name redirects to /monitoring?error=true if batch query param is missing', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/monitoring/batch/name',
        auth
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/monitoring?error=true')
    })

    test('GET /monitoring/batch/name returns view with payments when batch query param is provided', async () => {
      mockGetPaymentsByBatch.mockResolvedValue(DATA)

      const res = await server.inject({
        method: 'GET',
        url: '/monitoring/batch/name?batch=batch1',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('batch1')
      expect(res.payload).toContain('Monitoring')
    })
  })
})
