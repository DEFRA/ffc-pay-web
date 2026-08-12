jest.mock('../../../../app/alerts', () => ({
  getAlertsByScheme: jest.fn(),
  getAlertRecipientViewData: jest.fn(),
  getAlertRemoveViewData: jest.fn(),
  updateAlertUser: jest.fn(),
  removeAlertUser: jest.fn()
}))

jest.mock('../../../../app/helpers', () => ({
  getSchemes: jest.fn()
}))

jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn(),
  getProcessingData: jest.fn()
}))

jest.mock('../../../../app/routes/schemas/user-schema', () => ({
  validate: jest.fn()
}))

jest.mock('../../../../app/routes/schemas/remove-user-schema', () => ({
  validate: jest.fn()
}))

const {
  getAlertRecipientViewData,
  getAlertRemoveViewData,
  updateAlertUser,
  removeAlertUser
} = require('../../../../app/alerts')
const { getAlertingData } = require('../../../../app/api')
const { BAD_REQUEST } = require('../../../../app/constants/http-status-codes')
const routes = require('../../../../app/routes/alerts')

describe('Alerts route handlers', () => {
  let h

  const findRoute = (method, path) =>
    routes.find((route) => route.method === method && route.path === path)

  beforeEach(() => {
    jest.clearAllMocks()
    h = {
      view: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnValue('redirected'),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('taken over')
    }
  })

  test('GET /alerts/manage returns 200 and renders manage view when updated query present', async () => {
    const route = findRoute('GET', '/alerts/manage')
    getAlertingData.mockResolvedValue({
      payload: { contact: { emailAddress: 'user@example.com' } }
    })

    const result = await route.handler({ query: { updated: '123' } }, h)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/123')
    expect(h.view).toHaveBeenCalledWith('alerts/manage', {
      cards: expect.any(Array),
      updated: '123',
      emailAddress: 'user@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/information returns 200 and renders alert descriptions', async () => {
    const route = findRoute('GET', '/alerts/information')
    const fakeAlertDescriptions = [{
      id: 'desc1',
      type: 'PAYMENT_ALERT',
      description: [
        'This alert triggers on payment issues.'
      ]
    }]

    getAlertingData.mockResolvedValue({
      payload: { alertDescriptions: fakeAlertDescriptions }
    })

    const result = await route.handler({}, h)

    expect(getAlertingData).toHaveBeenCalledWith('/alert-descriptions')
    expect(h.view).toHaveBeenCalledWith('alerts/information', {
      alertDescriptions: fakeAlertDescriptions
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/confirm-delete with valid query renders confirm view', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')
    getAlertRemoveViewData.mockResolvedValue({
      contactId: '123',
      emailAddress: 'test@example.com'
    })

    const request = {
      query: { contactId: '123', emailAddress: 'test@example.com' }
    }

    const result = await route.handler(request, h)

    expect(getAlertRemoveViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/confirm-delete', {
      contactId: '123',
      emailAddress: 'test@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/confirm-delete without query still renders confirm route', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')
    getAlertRemoveViewData.mockResolvedValue({
      contactId: undefined,
      emailAddress: undefined
    })

    const request = { query: {} }

    const result = await route.handler(request, h)

    expect(getAlertRemoveViewData).toHaveBeenCalledWith(request)
    expect(result).toBe(h)
  })

  test('POST /alerts/update with action remove calls removeAlertUser and returns its result', async () => {
    const route = findRoute('POST', '/alerts/update')
    removeAlertUser.mockResolvedValue('remove-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'remove',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(removeAlertUser).toHaveBeenCalledWith(
      'TestUser',
      '123',
      'user@example.com',
      h
    )
    expect(result).toBe('remove-success')
  })

  test('POST /alerts/update with non-remove action calls updateAlertUser and returns its result', async () => {
    const route = findRoute('POST', '/alerts/update')
    updateAlertUser.mockResolvedValue('update-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(updateAlertUser).toHaveBeenCalledWith(
      'TestUser',
      request.payload,
      h,
      '/alerts/manage?updated=123'
    )
    expect(result).toBe('update-success')
  })

  test('POST /alerts/update handler catches updateAlertUser errors and renders error view with BAD_REQUEST', async () => {
    const route = findRoute('POST', '/alerts/update')
    const error = new Error('Something went wrong')
    updateAlertUser.mockRejectedValue(error)
    getAlertRecipientViewData.mockResolvedValue({ some: 'viewdata' })

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      some: 'viewdata',
      action: 'update',
      error
    })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })
})
