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
  getAlertsByScheme,
  getAlertRecipientViewData,
  getAlertRemoveViewData,
  updateAlertUser,
  removeAlertUser
} = require('../../../../app/alerts')
const { getSchemes } = require('../../../../app/helpers')
const { getAlertingData, getProcessingData } = require('../../../../app/api')
const { BAD_REQUEST, PRECONDITION_FAILED } = require('../../../../app/constants/http-status-codes')
const routes = require('../../../../app/routes/alerts')

describe('Alerts route handlers', () => {
  let h

  const findRoute = (method, path) => {
    const targetLast = String(path).split('/').filter(Boolean).pop()
    return routes.find((route) => {
      if (route.method !== method) return false
      if (typeof route.path !== 'string') return false
      const routeLast = route.path.split('/').filter(Boolean).pop()
      return routeLast === targetLast
    })
  }

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

  test('GET /alerts/manage-by-scheme returns 200 and renders scheme management view', async () => {
    const route = findRoute('GET', '/alerts/manage-by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]
    getSchemes.mockResolvedValue(schemes)

    const result = await route.handler({}, h)

    expect(getSchemes).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith('alerts/manage-by-scheme', {
      schemes,
      schemeName: undefined,
      emailAddress: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme without schemeId returns precondition failure view', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]
    getProcessingData.mockResolvedValue({
      payload: { paymentSchemes: schemes }
    })

    const result = await route.handler({ query: {} }, h)

    expect(getProcessingData).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: 'Select a scheme',
      data: schemes
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme with schemeId returns rendered scheme alerts view', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    getAlertsByScheme.mockResolvedValue({
      schemeName: 'Scheme 1',
      formattedTypes: [{ displayType: 'Payment alert', users: [] }]
    })

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      types: [{ displayType: 'Payment alert', users: [] }],
      schemeName: 'Scheme 1',
      schemeId: 'S1'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme returns precondition failure when scheme lookup fails', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = [{ schemeId: 'S1', name: 'Scheme 1' }]
    getAlertsByScheme.mockRejectedValue({ data: { payload: { message: 'Lookup failed' } } })
    getProcessingData.mockResolvedValue({
      payload: { paymentSchemes: schemes }
    })

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(getProcessingData).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: 'Lookup failed',
      schemeId: 'S1',
      data: schemes
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
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

  test('GET /alerts/update loads alert recipient data for an existing contact', async () => {
    const route = findRoute('GET', '/alerts/update')
    const viewData = {
      schemesPayload: [],
      alertTypesPayload: ['PAYMENT_ALERT'],
      contactId: '123',
      emailAddress: 'user@example.com'
    }
    getAlertRecipientViewData.mockResolvedValue(viewData)

    const request = {
      query: {
        action: 'edit',
        contactId: '123'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request, {
      loadContact: true
    })
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      ...viewData,
      action: 'edit',
      error: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/add-recipient-by-scheme renders the add recipient view', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')
    const viewData = {
      schemesPayload: [{ schemeId: 'S1', name: 'Scheme 1' }],
      schemeId: 'S1',
      alertTypesPayload: ['PAYMENT_ALERT']
    }
    getAlertRecipientViewData.mockResolvedValue(viewData)

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith({ query: { schemeId: 'S1' } })
    expect(h.view).toHaveBeenCalledWith('alerts/add-recipient-by-scheme', {
      ...viewData,
      action: 'create',
      error: undefined,
      schemeName: 'Scheme 1',
      pageTitle: 'Add new alert recipient for Scheme 1',
      formAction: '/alerts/add-recipient-by-scheme-confirm'
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

  test('GET /alerts/manage-by-recipient returns a recipient management view with updated contact info', async () => {
    const route = findRoute('GET', '/alerts/manage-by-recipient')
    getAlertingData.mockResolvedValue({
      payload: { contact: { emailAddress: 'user@example.com' } }
    })

    const result = await route.handler({ query: { updated: '123', removed: '456' } }, h)

    expect(getAlertingData).toHaveBeenCalledWith('/contact/123')
    expect(h.view).toHaveBeenCalledWith('alerts/manage-by-recipient', {
      cards: expect.any(Array),
      updated: '123',
      removed: '456',
      emailAddress: 'user@example.com'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/update-by-recipient renders a search view with validation error when email is supplied', async () => {
    const route = findRoute('GET', '/alerts/update-by-recipient')
    const result = await route.handler({
      query: {
        emailAddress: 'bad@example.com',
        validationError: 'true'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/update-by-recipient', {
      emailAddress: 'bad@example.com',
      error: 'The email address provided is either invalid or not configured to receive alerts'
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/remove-by-recipient renders a search view with validation error when email is supplied', async () => {
    const route = findRoute('GET', '/alerts/remove-by-recipient')
    const result = await route.handler({ query: { emailAddress: 'bad@example.com' } }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/remove-by-recipient', {
      emailAddress: 'bad@example.com',
      error: 'The email address provided is either invalid or not configured to receive alerts'
    })
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
      '/alerts/update?emailAddress=user%40example.com&success=true&successAction=update&contactId=123'
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
      error: error.message
    })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })

  test('GET /alerts/manage without updated renders manage view with undefined email', async () => {
    const route = findRoute('GET', '/alerts/manage')

    const result = await route.handler({ query: {} }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/manage', {
      cards: expect.any(Array),
      updated: undefined,
      emailAddress: undefined
    })
    expect(result).toBe(h)
  })

  test('POST /alerts/update with schemeId calls updateAlertUser and constructs success redirect', async () => {
    const route = findRoute('POST', '/alerts/update')
    updateAlertUser.mockResolvedValue('update-success')

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'update',
        schemeId: 'S1',
        emailAddress: 'user@example.com'
      }
    }

    const expectedRedirect = `/alerts/update?emailAddress=${encodeURIComponent(
      'user@example.com'
    )}&success=true&successAction=update`

    const result = await route.handler(request, h)

    expect(updateAlertUser).toHaveBeenCalledWith(
      'TestUser',
      request.payload,
      h,
      expectedRedirect
    )
    expect(result).toBe('update-success')
  })

  test('GET /alerts/remove-by-recipient without email renders view with null error', async () => {
    const route = findRoute('GET', '/alerts/remove-by-recipient')

    const result = await route.handler({ query: {} }, h)

    expect(h.view).toHaveBeenCalledWith('alerts/remove-by-recipient', {
      emailAddress: undefined,
      error: null
    })
    expect(result).toBe(h)
  })

  test('POST /alerts/update with action remove that errors renders update view with BAD_REQUEST', async () => {
    const route = findRoute('POST', '/alerts/update')
    const error = new Error('Remove failed')
    removeAlertUser.mockRejectedValue(error)
    getAlertRecipientViewData.mockResolvedValue({ some: 'viewdata' })

    const request = {
      auth: { credentials: { account: { name: 'TestUser' } } },
      payload: {
        action: 'remove',
        contactId: '123',
        emailAddress: 'user@example.com'
      }
    }

    const result = await route.handler(request, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith('alerts/update', {
      some: 'viewdata',
      action: 'remove',
      error: error.message
    })
    expect(h.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(h)
  })

  test('calls handleAlertingError for GET /alerts/manage when getAlertingData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-manage')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const api = require('../../../../app/api')
    api.getAlertingData.mockRejectedValue(new Error('manage fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/manage')
    const result = await route.handler({ query: { updated: '123' } }, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-manage')
  })

  test('calls handleAlertingError for GET /alerts/manage-by-scheme when getSchemes rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-manage-by-scheme')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const helpers = require('../../../../app/helpers')
    helpers.getSchemes.mockRejectedValue(new Error('schemes fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/manage-by-scheme')
    const result = await route.handler({}, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-manage-by-scheme')
  })

  test('calls handleAlertingError for GET /alerts/information when getAlertingData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-information')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const api = require('../../../../app/api')
    api.getAlertingData.mockRejectedValue(new Error('info fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/information')
    const result = await route.handler({}, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-information')
  })

  test('GET /alerts/update redirects to update-by-recipient when getAlertRecipientViewData rejects', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockRejectedValue(
      new Error('update fail')
    )

    h.redirect.mockReturnValue('redirected')

    const result = await route.handler({
      query: {
        action: 'edit',
        emailAddress: 'bad@example.com'
      }
    }, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/alerts/update-by-recipient?emailAddress=bad%40example.com&validationError=true'
    )

    expect(result).toBe('redirected')
  })

  test('calls handleAlertingError for GET /alerts/add-recipient-by-scheme when getAlertRecipientViewData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-add-recipient')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const alertsMod = require('../../../../app/alerts')
    alertsMod.getAlertRecipientViewData.mockRejectedValue(new Error('add-recipient fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/add-recipient-by-scheme')
    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-add-recipient')
  })

  test('calls handleAlertingError for POST /alerts/update-confirm when getAlertRecipientViewData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-update-confirm')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const alertsMod = require('../../../../app/alerts')
    alertsMod.getAlertRecipientViewData.mockRejectedValue(new Error('confirm fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('POST', '/alerts/update-confirm')
    const request = { payload: { contactId: '123' } }
    const result = await route.handler(request, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-update-confirm')
  })

  test('calls handleAlertingError for GET /alerts/confirm-delete when getAlertRemoveViewData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-confirm-delete')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const alertsMod = require('../../../../app/alerts')
    alertsMod.getAlertRemoveViewData.mockRejectedValue(new Error('remove confirm fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/confirm-delete')
    const request = { query: {} }
    const result = await route.handler(request, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-confirm-delete')
  })

  test('calls handleAlertingError for GET /alerts/manage-by-recipient when getAlertingData rejects', async () => {
    jest.resetModules()
    const realHelpers = jest.requireActual('../../../../app/alerts/alert-route-helpers')
    const handle = jest.fn().mockReturnValue('handled-manage-by-recipient')
    jest.doMock('../../../../app/alerts/alert-route-helpers', () => ({ ...realHelpers, handleAlertingError: handle }))

    const api = require('../../../../app/api')
    api.getAlertingData.mockRejectedValue(new Error('manage-by-recipient fail'))

    const routesLocal = require('../../../../app/routes/alerts')
    const findLocal = (method, path) => routesLocal.find((r) => r.method === method && typeof r.path === 'string' && r.path.split('/').filter(Boolean).pop() === String(path).split('/').filter(Boolean).pop())

    const route = findLocal('GET', '/alerts/manage-by-recipient')
    const result = await route.handler({ query: { updated: '123' } }, h)

    expect(handle).toHaveBeenCalled()
    expect(result).toBe('handled-manage-by-recipient')
  })

  test('validate.failAction for POST /alerts/update-confirm redirects and takes over', async () => {
    const route = findRoute('POST', '/alerts/update-confirm')
    const hFail = {
      redirect: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('taken over')
    }

    const result = await route.options.validate.failAction({ payload: { contactId: '1' } }, hFail, new Error('val err'))

    expect(hFail.redirect).toHaveBeenCalled()
    expect(hFail.takeover).toHaveBeenCalled()
    expect(result).toBe('taken over')
  })

  test('validate.failAction for POST /alerts/update (non-remove) redirects and takes over', async () => {
    const route = findRoute('POST', '/alerts/update')
    const hFail = {
      redirect: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('taken over')
    }

    const request = { payload: { action: 'update', contactId: '1' } }
    const result = await route.options.validate.failAction(request, hFail, new Error('val err'))

    expect(hFail.redirect).toHaveBeenCalled()
    expect(hFail.takeover).toHaveBeenCalled()
    expect(result).toBe('taken over')
  })

  test('validate.failAction for POST /alerts/update (remove) renders update view with BAD_REQUEST', async () => {
    const route = findRoute('POST', '/alerts/update')
    const viewData = { some: 'viewdata' }
    getAlertRecipientViewData.mockResolvedValue(viewData)

    const request = { payload: { action: 'remove', contactId: '123', emailAddress: 'a@b.c' } }
    const hLocal = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }

    const result = await route.options.validate.failAction(request, hLocal, new Error('validation error'))

    expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
    expect(hLocal.view).toHaveBeenCalledWith('alerts/update', {
      ...viewData,
      action: 'remove',
      error: 'validation error'
    })
    expect(hLocal.code).toHaveBeenCalledWith(BAD_REQUEST)
    expect(result).toBe(hLocal)
  })
})
