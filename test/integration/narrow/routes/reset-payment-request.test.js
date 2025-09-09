jest.mock('../../../../app/plugins/crumb')
jest.mock('../../../../app/api')
const { postProcessing } = require('../../../../app/api')
jest.mock('../../../../app/auth')
const createServer = require('../../../../app/server')
const { schemeAdmin } = require('../../../../app/auth/permissions')
const Boom = require('@hapi/boom')

const url = '/payment-request/reset'
const validInvoiceNumber = 'S1234567S123456V001'
let server
let auth

describe('Reset payment request', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('returns 403 if no permissions in scope', async () => {
    auth.credentials.scope = []
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.statusCode).toBe(403)
  })

  test('returns 302 if not authorised', async () => {
    const res = await server.inject({ method: 'GET', url })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/login')
  })

  test('returns 200 if authorised', async () => {
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.statusCode).toBe(200)
  })

  test('returns 400 if no invoice', async () => {
    const res = await server.inject({ method: 'POST', url, auth, payload: {} })
    expect(res.statusCode).toBe(400)
  })

  test('returns 400 if invalid invoice', async () => {
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: true } })
    expect(res.statusCode).toBe(400)
  })

  test('returns 400 if undefined invoice', async () => {
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: undefined } })
    expect(res.statusCode).toBe(400)
  })

  test('returns 302 to success if valid invoice', async () => {
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: validInvoiceNumber } })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/payment-request/reset-success?invoiceNumber=S1234567S123456V001')
  })

  test('returns error if rejected request', async () => {
    postProcessing.mockImplementation(() => { throw Boom.preconditionFailed('Rejected') })
    const res = await server.inject({ method: 'POST', url, auth, payload: { invoiceNumber: validInvoiceNumber } })
    expect(res.statusCode).toBe(412)
    expect(res.request.response.source.context.error).toBe('Rejected')
  })
})
