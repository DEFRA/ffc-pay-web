jest.mock('../../../../app/alerts')
jest.mock('../../../../app/api')

const {
  updateAlertUser,
  removeAlertUser,
  getContactsByScheme,
  getAlertUpdateViewData
} = require('../../../../app/alerts')
const { getAlertingData } = require('../../../../app/api')

const createServer = require('../../../../app/server')
const { holdAdmin } = require('../../../../app/auth/permissions')

describe('Alerts Routes Integration Test', () => {
  let server

  const auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin], account: { name: 'John Doe', username: 'johndoe', email: 'john@example.com' } } }

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()

    jest.clearAllMocks()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET /alerts', () => {
    test('returns 200 and renders alerts view with schemes', async () => {
      const schemesMock = [{ id: 1, name: 'Scheme A' }]
      getContactsByScheme.mockResolvedValue(schemesMock)

      const res = await server.inject({
        method: 'GET',
        url: '/alerts',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('Scheme A')
      expect(getContactsByScheme).toHaveBeenCalled()
    })

    test('redirects to login if no auth', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/alerts'
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('GET /alerts/information', () => {
    test('returns 200 and renders information view with alertDescriptions', async () => {
      const alertDescriptions = [{ id: 'a1', text: 'desc1' }]
      getAlertingData.mockResolvedValue({ payload: { alertDescriptions } })

      const res = await server.inject({
        method: 'GET',
        url: '/alerts/information',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('desc1')
      expect(getAlertingData).toHaveBeenCalledWith('/alert-descriptions')
    })

    test('handles missing payload gracefully', async () => {
      getAlertingData.mockResolvedValue({})

      const res = await server.inject({
        method: 'GET',
        url: '/alerts/information',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('alerts/information')
      expect(getAlertingData).toHaveBeenCalled()
    })

    test('redirects to login if no auth', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/alerts/information'
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('GET /alerts/update', () => {
    test('returns 200 and renders update view', async () => {
      const viewDataMock = { contactId: 123, other: 'data' }
      getAlertUpdateViewData.mockResolvedValue(viewDataMock)

      const res = await server.inject({
        method: 'GET',
        url: '/alerts/update',
        auth
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('alerts/update')
      expect(getAlertUpdateViewData).toHaveBeenCalled()
    })

    test('redirects to login if no auth', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/alerts/update'
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('POST /alerts/update', () => {
    test('calls removeAlertUser and returns response when action is remove', async () => {
      removeAlertUser.mockResolvedValue('remove-response')

      const payload = {
        action: 'remove',
        contactId: 'contact-1'
      }

      const res = await server.inject({
        method: 'POST',
        url: '/alerts/update',
        auth,
        payload
      })

      expect(removeAlertUser).toHaveBeenCalledWith(auth.credentials.account.name, payload.contactId, expect.any(Object))
      expect(res.statusCode).toBe(200)
      expect(res.payload).toBe('remove-response')
    })

    test('calls updateAlertUser and returns response when action is update', async () => {
      updateAlertUser.mockResolvedValue('update-response')

      const payload = {
        action: 'update',
        contactId: 'contact-2',
        someData: 'value'
      }

      const res = await server.inject({
        method: 'POST',
        url: '/alerts/update',
        auth,
        payload
      })

      expect(updateAlertUser).toHaveBeenCalledWith(auth.credentials.account.name, payload, expect.any(Object))
      expect(res.statusCode).toBe(200)
      expect(res.payload).toBe('update-response')
    })

    test('handles validation failure and returns 400 with error view', async () => {
      const payload = {
        action: 'update'
      }

      getAlertUpdateViewData.mockResolvedValue({ some: 'viewData' })

      const res = await server.inject({
        method: 'POST',
        url: '/alerts/update',
        auth,
        payload
      })

      expect(res.statusCode).toBe(400)
      expect(res.payload).toContain('alerts/update')
      expect(getAlertUpdateViewData).toHaveBeenCalled()
    })

    test('handles thrown error in handler and returns 400 with error view', async () => {
      const payload = {
        action: 'update',
        contactId: 'contact-3'
      }

      const error = new Error('fail')
      updateAlertUser.mockRejectedValue(error)
      getAlertUpdateViewData.mockResolvedValue({ some: 'viewData' })

      const res = await server.inject({
        method: 'POST',
        url: '/alerts/update',
        auth,
        payload
      })

      expect(updateAlertUser).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(res.payload).toContain('alerts/update')
      expect(getAlertUpdateViewData).toHaveBeenCalled()
      expect(res.payload).toContain('fail') // error message should be rendered
    })

    test('redirects to login if no auth', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/alerts/update',
        payload: {
          action: 'update',
          contactId: 'some-id'
        }
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })
})
