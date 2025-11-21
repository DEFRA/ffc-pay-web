const createServer = require('../../../../app/server')
jest.mock('../../../../app/auth')
const mockAuth = require('../../../../app/auth')
const ERROR_VIEWS = require('../../../../app/constants/error-views')
const HTTP_STATUS = require('../../../../app/constants/http-status-codes')

describe('dev-auth test', () => {
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

  test('GET /dev-auth redirects to / and calls dev-auth', async () => {
    const res = await server.inject({ method: 'GET', url: '/dev-auth' })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/')
    expect(mockAuth.authenticate).toHaveBeenCalled()
  })

  test('GET /dev-auth returns 500 view and logs error when authentication fails', async () => {
    const fakeError = new Error('Boom!')
    mockAuth.authenticate.mockRejectedValue(fakeError)

    const res = await server.inject({ method: 'GET', url: '/dev-auth' })

    expect(res.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(res.request.response.source.template).toBe(ERROR_VIEWS.INTERNAL_SERVER_ERROR)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error authenticating', fakeError)
  })
})
