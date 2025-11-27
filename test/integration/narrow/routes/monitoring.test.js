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
    '/monitoring/payments/frn',
    '/monitoring/payments/correlation-id',
    '/monitoring/batch/name',
    '/monitoring/view-processed-payment-requests'
  ].forEach(path => {
    testRoute(path, path.includes('processed') ? 'processed payment requests' : 'Monitoring')
  })
})
