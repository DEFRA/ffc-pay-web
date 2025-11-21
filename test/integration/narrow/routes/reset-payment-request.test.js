jest.mock('../../../../app/plugins/crumb')
jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')

const { postProcessing } = require('../../../../app/api')
const createServer = require('../../../../app/server')
const { schemeAdmin } = require('../../../../app/auth/permissions')
const Boom = require('@hapi/boom')

const url = '/payment-request/reset'
const validInvoiceNumber = 'S1234567S123456V001'

let server
let auth

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
  jest.clearAllMocks()
  server = await createServer()
})

afterEach(async () => { await server.stop() })

const testGetRoute = (expectedStatus, authOverride, redirectLocation) => {
  const options = { method: 'GET', url, auth: authOverride }
  return server.inject(options).then(res => {
    expect(res.statusCode).toBe(expectedStatus)
    if (redirectLocation) expect(res.headers.location).toBe(redirectLocation)
  })
}

const testPostRoute = (payload, expectedStatus, expectedRedirect) => {
  const options = { method: 'POST', url, auth, payload }
  return server.inject(options).then(res => {
    expect(res.statusCode).toBe(expectedStatus)
    if (expectedRedirect) expect(res.headers.location).toBe(expectedRedirect)
  })
}

describe('Reset payment request', () => {
  test('GET / returns 403 if no permissions', () => testGetRoute(403, { ...auth, credentials: { scope: [] } }))
  test('GET / redirects to login if unauthenticated', () => testGetRoute(302, undefined, '/login'))
  test('GET / returns 200 if authorised', () => testGetRoute(200, auth))

  test.each([
    [{}, 400],
    [{ invoiceNumber: true }, 400],
    [{ invoiceNumber: undefined }, 400]
  ])('POST / returns 400 for invalid payload %#', (payload, status) => testPostRoute(payload, status))

  test('POST / redirects to success if valid invoice', () =>
    testPostRoute({ invoiceNumber: validInvoiceNumber }, 302, `/payment-request/reset-success?invoiceNumber=${validInvoiceNumber}`)
  )

  test('POST / returns 412 if request rejected', async () => {
    postProcessing.mockImplementation(() => { throw Boom.preconditionFailed('Rejected') })
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: validInvoiceNumber } })
    expect(res.statusCode).toBe(412)
    expect(res.request.response.source.context.error).toBe('Rejected')
  })
})
