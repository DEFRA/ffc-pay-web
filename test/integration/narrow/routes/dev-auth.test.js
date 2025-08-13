describe('dev-auth test', () => {
  jest.mock('../../../../app/auth')
  const mockAuth = require('../../../../app/auth')
  const ERROR_VIEWS = require('../../../../app/constants/error-views')
  const HTTP_STATUS = require('../../../../app/constants/http-status-codes')
  const createServer = require('../../../../app/server')
  let server
  let consoleErrorSpy

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockAuth.authenticate.mockResolvedValue()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await server.stop()
  })

  test('GET /dev-auth route returns 302', async () => {
    const options = { method: 'GET', url: '/dev-auth' }
    const response = await server.inject(options)
    expect(response.statusCode).toBe(302)
  })

  test('GET /dev-auth route redirects to /', async () => {
    const options = { method: 'GET', url: '/dev-auth' }
    const response = await server.inject(options)
    expect(response.headers.location).toBe('/')
  })

  test('GET /dev-auth route calls dev-auth', async () => {
    const options = { method: 'GET', url: '/dev-auth' }
    await server.inject(options)
    expect(mockAuth.authenticate).toHaveBeenCalled()
  })

  test('GET /dev-auth returns 500 view and logs error when authentication fails', async () => {
    const fakeError = new Error('Boom!')
    mockAuth.authenticate.mockRejectedValue(fakeError)

    const response = await server.inject({ method: 'GET', url: '/dev-auth' })

    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(response.request.response.source.template).toBe(ERROR_VIEWS.INTERNAL_SERVER_ERROR)

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error authenticating', fakeError)
  })
})
