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
  getAlertingData: jest.fn()
}))

jest.mock('ffc-pay-schemes', () => ({
  getSchemeNameFromSchemeId: jest.fn((schemeId) => {
    if (schemeId === 'S1') return 'Scheme 1'
    return 'Unknown'
  })
}))

const {
  getAlertsByScheme,
  getAlertRecipientViewData,
  getAlertRemoveViewData,
  updateAlertUser,
  removeAlertUser
} = require('../../../../app/alerts')
const { getSchemes } = require('../../../../app/helpers')
const { getAlertingData } = require('../../../../app/api')
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
      redirect: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
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
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }
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
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }
    getSchemes.mockReturnValue(schemes)

    const result = await route.handler({ query: {} }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: 'Select a scheme',
      data: schemes.payload.paymentSchemes
    })
    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme with schemeId returns rendered scheme alerts view', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }

    getSchemes.mockReturnValue(schemes)
    getAlertsByScheme.mockResolvedValue({
      schemeName: 'Scheme 1',
      formattedTypes: [{ displayType: 'Payment alert', users: [] }]
    })

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      types: [{ displayType: 'Payment alert', users: [] }],
      schemeName: 'Scheme 1',
      schemeId: 'S1',
      successMessage: undefined
    })
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme returns precondition failure when scheme lookup fails', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }

    getSchemes.mockReturnValue(schemes)
    getAlertsByScheme.mockRejectedValue({ data: { payload: { message: 'Lookup failed' } } })

    const result = await route.handler({ query: { schemeId: 'S1' } }, h)

    expect(getSchemes).toHaveBeenCalled()
    expect(getAlertsByScheme).toHaveBeenCalledWith('S1')
    expect(h.view).toHaveBeenCalledWith('alerts/by-scheme', {
      error: 'Lookup failed',
      schemeId: 'S1',
      data: schemes.payload.paymentSchemes
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
      error: null,
      successMessage: undefined
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
      error: null,
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

    const result = await route.handler({
      query: {
        emailAddress: 'bad@example.com',
        validationError: true
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/remove-by-recipient',
      {
        emailAddress: 'bad@example.com',
        error:
          'The email address provided is either invalid or not configured to receive alerts'
      }
    )
    expect(result).toBe(h)
  })

  test('GET /alerts/remove-by-recipient does not show an error when only email is supplied', async () => {
    const route = findRoute('GET', '/alerts/remove-by-recipient')

    await route.handler({
      query: {
        emailAddress: 'bad@example.com'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/remove-by-recipient',
      {
        emailAddress: 'bad@example.com',
        error: null
      }
    )
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

  test('GET /alerts/update redirects to update path when getAlertRecipientViewData rejects', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockRejectedValue(new Error('update fail'))

    const result = await route.handler({
      query: {
        action: 'edit',
        emailAddress: 'bad@example.com'
      }
    }, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/alerts/update?emailAddress=bad%40example.com&validationError=true'
    )
    expect(result).toBe(h)
  })

  test('GET /alerts/by-scheme returns no scheme found error for invalid schemeId', async () => {
    const route = findRoute('GET', '/alerts/by-scheme')
    const schemes = {
      payload: {
        paymentSchemes: [{ schemeId: 'S1', name: 'Scheme 1' }]
      }
    }

    getSchemes.mockReturnValue(schemes)

    const result = await route.handler({
      query: {
        schemeId: '999'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/by-scheme',
      {
        error: 'No scheme found for Scheme ID 999',
        schemeId: '999',
        data: schemes.payload.paymentSchemes
      }
    )

    expect(h.code).toHaveBeenCalledWith(PRECONDITION_FAILED)
    expect(result).toBe(h)
  })

  test('GET /alerts/update builds create success message', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockResolvedValue({
      emailAddress: 'user@example.com'
    })

    await route.handler({
      query: {
        success: 'true',
        successAction: 'create'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        successMessage:
          'user@example.com will now receive the selected email alerts.'
      })
    )
  })

  test('GET /alerts/update builds update success message', async () => {
    const route = findRoute('GET', '/alerts/update')

    getAlertRecipientViewData.mockResolvedValue({
      emailAddress: 'user@example.com'
    })

    await route.handler({
      query: {
        success: 'true',
        successAction: 'edit'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update',
      expect.objectContaining({
        successMessage:
          'Alerts for user@example.com have been updated.'
      })
    )
  })

  test('POST /alerts/update-confirm renders confirmation view', async () => {
    const route = findRoute('POST', '/alerts/update-confirm')

    getAlertRecipientViewData.mockResolvedValue({
      schemesPayload: [],
      alertTypesPayload: []
    })

    await route.handler({
      payload: {
        contactId: '123',
        emailAddress: 'user@example.com',
        action: 'edit'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/update-confirm',
      expect.objectContaining({
        contactId: '123',
        emailAddress: 'user@example.com'
      })
    )
  })

  test('GET /alerts/add-recipient-by-scheme keeps the form open for an unknown scheme', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')

    getAlertRecipientViewData.mockResolvedValue({
      schemesPayload: [],
      schemeId: '999',
      alertTypesPayload: []
    })

    await route.handler({
      query: {
        schemeId: '999'
      }
    }, h)

    expect(getAlertRecipientViewData).toHaveBeenCalledWith({
      query: {
        schemeId: '999'
      }
    })

    expect(h.view).toHaveBeenCalledWith(
      'alerts/add-recipient-by-scheme',
      {
        action: 'create',
        error: null,
        formAction: '/alerts/add-recipient-by-scheme-confirm',
        pageTitle: 'Add new alert recipient for Unknown',
        schemeId: '999',
        schemeName: 'Unknown',
        schemesPayload: [],
        alertTypesPayload: []
      }
    )

    expect(h.code).not.toHaveBeenCalled()
  })

  test('GET /alerts/add-recipient-by-scheme passes validation error through sanitiser', async () => {
    const route = findRoute('GET', '/alerts/add-recipient-by-scheme')

    getAlertRecipientViewData.mockResolvedValue({
      schemesPayload: [{
        schemeId: 'S1',
        name: 'Scheme 1'
      }],
      schemeId: 'S1'
    })

    await route.handler({
      query: {
        schemeId: 'S1',
        validationError: 'Email address is required'
      }
    }, h)

    expect(h.view).toHaveBeenCalledWith(
      'alerts/add-recipient-by-scheme',
      expect.objectContaining({
        error: 'Email address is required'
      })
    )
  })

  test('GET /alerts/confirm-delete redirects for NOT_FOUND errors', async () => {
    const route = findRoute('GET', '/alerts/confirm-delete')

    getAlertRemoveViewData.mockRejectedValue({
      isBoom: true,
      output: {
        statusCode: 404
      }
    })

    const result = await route.handler({
      query: {
        emailAddress: 'missing@example.com'
      }
    }, h)

    expect(h.redirect).toHaveBeenCalledWith(
      '/alerts/remove-by-recipient?emailAddress=missing%40example.com&validationError=true'
    )

    expect(result).toBe(h)
  })
})
