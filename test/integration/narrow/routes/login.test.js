const createServer = require('../../../../app/server')

jest.mock('../../../../app/auth/azure-auth')
const mockAzureAuth = require('../../../../app/auth/azure-auth')

describe('Login tests', () => {
  let server
  const url = '/login'

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('Login GET request', () => {
    const method = 'GET'

    test('GET /login route redirects to auth URL', async () => {
      mockAzureAuth.getAuthenticationUrl.mockResolvedValue('/')

      const response = await server.inject({ method, url })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual('/')
      expect(mockAzureAuth.getAuthenticationUrl).toHaveBeenCalled()
    })

    test('GET /login route returns 500 if auth fails', async () => {
      mockAzureAuth.getAuthenticationUrl.mockImplementation(() => {
        throw new Error('Auth failure')
      })

      const response = await server.inject({ method, url })

      expect(response.statusCode).toBe(500)
      expect(mockAzureAuth.getAuthenticationUrl).toHaveBeenCalled()
    })
  })
})
