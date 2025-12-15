const Boom = require('@hapi/boom')
const {
  updateAlertUser,
  getContactsByScheme,
  getAlertUpdateViewData
} = require('../../../app/alerts')
const { getAlertingData } = require('../../../app/api')

jest.mock('../../../app/alerts')
jest.mock('../../../app/api')
jest.mock('../../../app/routes/schemas/user-schema')
jest.mock('../../../app/routes/schemas/remove-user-schema')

const alertRoutes = require('../../../app/routes/alerts')

describe('Alerts Routes - handleAlertingError coverage', () => {
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('GET /alerts - handleAlertingError', () => {
    test('logs error message and returns Boom.badGateway when getContactsByScheme throws', async () => {
      const error = new Error('Service connection failed')
      getContactsByScheme.mockRejectedValue(error)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      const result = await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: Service connection failed')
    })

    test('logs error with different message and returns appropriate Boom response', async () => {
      const error = new Error('Network timeout')
      getContactsByScheme.mockRejectedValue(error)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      const result = await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toContain('Network timeout')
    })
  })

  describe('GET /alerts/information - handleAlertingError', () => {
    test('logs error and returns Boom.badGateway when getAlertingData throws', async () => {
      const error = new Error('Alert descriptions unavailable')
      getAlertingData.mockRejectedValue(error)

      const getInformationRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/information'
      )
      const handler = getInformationRoute.options.handler

      const result = await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: Alert descriptions unavailable')
    })

    test('handles empty alertDescriptions payload gracefully', async () => {
      getAlertingData.mockResolvedValue({ payload: {} })

      const getInformationRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/information'
      )
      const handler = getInformationRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }

      await handler({}, h)

      expect(mockView).toHaveBeenCalledWith('alerts/information', { alertDescriptions: [] })
    })

    test('handles null alertDescriptions in payload', async () => {
      getAlertingData.mockResolvedValue({ payload: { alertDescriptions: null } })

      const getInformationRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/information'
      )
      const handler = getInformationRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }

      await handler({}, h)

      expect(mockView).toHaveBeenCalledWith('alerts/information', { alertDescriptions: [] })
    })

    test('handles undefined payload', async () => {
      getAlertingData.mockResolvedValue({})

      const getInformationRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/information'
      )
      const handler = getInformationRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }

      await handler({}, h)

      expect(mockView).toHaveBeenCalledWith('alerts/information', { alertDescriptions: [] })
    })
  })

  describe('GET /alerts/update - handleAlertingError', () => {
    test('logs error and returns Boom.badGateway when getAlertUpdateViewData throws', async () => {
      const error = new Error('Failed to fetch view data')
      getAlertUpdateViewData.mockRejectedValue(error)

      const getUpdateRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/update'
      )
      const handler = getUpdateRoute.options.handler

      const result = await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: Failed to fetch view data')
    })
  })

  describe('GET /alerts/confirm-delete - contactPayload handling', () => {
    test('handles missing emailAddress in contactPayload and redirects to alerts view', async () => {
      const contactId = 123
      getAlertingData.mockResolvedValue({
        payload: {
          contact: {}
        }
      })
      getContactsByScheme.mockResolvedValue([{ id: 1, name: 'Scheme1' }])

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const handler = getConfirmRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }
      const request = { query: { contactId } }

      await handler(request, h)

      expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodeURIComponent(contactId)}`)
      expect(getContactsByScheme).toHaveBeenCalled()
      expect(mockView).toHaveBeenCalledWith('alerts', { schemes: [{ id: 1, name: 'Scheme1' }] })
    })

    test('handles null contact in payload', async () => {
      const contactId = 456
      getAlertingData.mockResolvedValue({
        payload: {
          contact: null
        }
      })
      getContactsByScheme.mockResolvedValue([{ id: 2, name: 'Scheme2' }])

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const handler = getConfirmRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }
      const request = { query: { contactId } }

      await handler(request, h)

      expect(getContactsByScheme).toHaveBeenCalled()
      expect(mockView).toHaveBeenCalledWith('alerts', { schemes: [{ id: 2, name: 'Scheme2' }] })
    })

    test('handles undefined emailAddress in contactPayload', async () => {
      const contactId = 789
      getAlertingData.mockResolvedValue({
        payload: {
          contact: {
            name: 'John Doe'
          }
        }
      })
      getContactsByScheme.mockResolvedValue([])

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const handler = getConfirmRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }
      const request = { query: { contactId } }

      await handler(request, h)

      expect(mockView).toHaveBeenCalledWith('alerts', { schemes: [] })
    })

    test('handles empty string emailAddress', async () => {
      const contactId = 101
      getAlertingData.mockResolvedValue({
        payload: {
          contact: {
            emailAddress: ''
          }
        }
      })
      getContactsByScheme.mockResolvedValue([{ id: 3, name: 'Scheme3' }])

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const handler = getConfirmRoute.options.handler

      const mockView = jest.fn()
      const h = { view: mockView }
      const request = { query: { contactId } }

      await handler(request, h)

      expect(mockView).toHaveBeenCalledWith('alerts', { schemes: [{ id: 3, name: 'Scheme3' }] })
    })

    test('logs error and returns Boom.badGateway when getAlertingData throws', async () => {
      const contactId = 202
      const error = new Error('Contact service unavailable')
      getAlertingData.mockRejectedValue(error)

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const handler = getConfirmRoute.options.handler

      const request = { query: { contactId } }

      const result = await handler(request, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: Contact service unavailable')
    })

    test('logs error in failAction and returns Boom.badGateway when getContactsByScheme throws', async () => {
      const error = new Error('Schemes fetch failed')
      getContactsByScheme.mockRejectedValue(error)

      const getConfirmRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts/confirm-delete'
      )
      const failAction = getConfirmRoute.options.validate.failAction

      const result = await failAction({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: Schemes fetch failed')
    })
  })

  describe('POST /alerts/update - handleAlertingError in handler', () => {
    test('logs outer catch error and returns Boom.badGateway when request.auth throws', async () => {
      const request = {
        get auth () {
          throw new Error('Authentication error')
        },
        payload: { action: 'update' }
      }

      const postUpdateRoute = alertRoutes.find(
        route => route.method === 'POST' && route.path === '/alerts/update'
      )
      const handler = postUpdateRoute.handler

      const result = await handler(request, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', expect.any(Error))
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe('Authentication error')
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
    })

    test('logs error when getAlertUpdateViewData fails in inner catch', async () => {
      const updateError = new Error('Update failed')
      const viewError = new Error('View data fetch failed')
      updateAlertUser.mockRejectedValue(updateError)
      getAlertUpdateViewData.mockRejectedValue(viewError)

      const request = {
        auth: {
          credentials: {
            account: { name: 'TestUser' }
          }
        },
        payload: { action: 'update', email: 'test@example.com' }
      }

      const postUpdateRoute = alertRoutes.find(
        route => route.method === 'POST' && route.path === '/alerts/update'
      )
      const handler = postUpdateRoute.handler

      const result = await handler(request, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', viewError)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: View data fetch failed')
    })

    test('logs error in failAction inner catch when getAlertUpdateViewData throws', async () => {
      const error = new Error('View data unavailable in failAction')
      getAlertUpdateViewData.mockRejectedValue(error)

      const postUpdateRoute = alertRoutes.find(
        route => route.method === 'POST' && route.path === '/alerts/update'
      )
      const failAction = postUpdateRoute.options.validate.failAction

      const validationError = new Error('Validation failed')
      const request = { payload: { action: 'update' } }

      const result = await failAction(request, {}, validationError)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toBe('Alerting Service is unavailable: View data unavailable in failAction')
    })

    test('logs outer error in failAction when getAlertUpdateViewData throws in first try', async () => {
      const innerError = new Error('Inner view data error')
      getAlertUpdateViewData.mockRejectedValue(innerError)

      const postUpdateRoute = alertRoutes.find(
        route => route.method === 'POST' && route.path === '/alerts/update'
      )
      const failAction = postUpdateRoute.options.validate.failAction

      const validationError = new Error('Validation failed')
      const request = { payload: { action: 'update' } }

      const result = await failAction(request, {}, validationError)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', innerError)
      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(502)
    })
  })

  describe('Error message variations', () => {
    test('handleAlertingError preserves original error message', async () => {
      const customError = new Error('Custom database connection error')
      getContactsByScheme.mockRejectedValue(customError)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      const result = await handler({}, {})

      expect(result.message).toBe('Alerting Service is unavailable: Custom database connection error')
    })

    test('handleAlertingError with error without message property', async () => {
      const error = { toString: () => 'String error' }
      getContactsByScheme.mockRejectedValue(error)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      const result = await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', error)
      expect(Boom.isBoom(result)).toBe(true)
    })

    test('handleAlertingError logs complete error object', async () => {
      const complexError = new Error('Complex error')
      complexError.stack = 'Error stack trace...'
      complexError.code = 'ERR_CONNECTION'
      getContactsByScheme.mockRejectedValue(complexError)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledWith('Alerting Service error:', complexError)
      expect(consoleErrorSpy.mock.calls[0][1]).toHaveProperty('stack')
      expect(consoleErrorSpy.mock.calls[0][1]).toHaveProperty('code', 'ERR_CONNECTION')
    })
  })

  describe('Multiple error scenarios', () => {
    test('consecutive errors are logged independently', async () => {
      const error1 = new Error('First error')
      const error2 = new Error('Second error')

      getContactsByScheme.mockRejectedValueOnce(error1)
      getContactsByScheme.mockRejectedValueOnce(error2)

      const getAlertsRoute = alertRoutes.find(
        route => route.method === 'GET' && route.path === '/alerts'
      )
      const handler = getAlertsRoute.options.handler

      await handler({}, {})
      await handler({}, {})

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Alerting Service error:', error1)
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Alerting Service error:', error2)
    })
  })
})
