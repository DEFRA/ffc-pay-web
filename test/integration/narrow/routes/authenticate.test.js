const createServer = require('../../../../app/server')
jest.mock('../../../../app/auth/azure-auth')
const mockAzureAuth = require('../../../../app/auth')

describe('Authentication route tests', () => {
  let server
  const url = '/authenticate'

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /authenticate redirects to "/"', async () => {
    const res = await server.inject({ method: 'GET', url })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/')
  })

  test('GET /authenticate returns 500 if authenticate throws', async () => {
    mockAzureAuth.authenticate.mockImplementation(() => { throw new Error() })
    const res = await server.inject({ method: 'GET', url })
    expect(res.statusCode).toBe(500)
  })
})
