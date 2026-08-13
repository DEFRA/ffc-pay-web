jest.mock('@hapi/boom', () => ({
  Boom: {
    badGateway: jest.fn((message) => ({
      isBoom: true,
      output: { statusCode: 502 },
      message
    }))
  }
}))

jest.mock('../../../app/alerts/get-alert-recipient-view-data', () => ({
  normaliseValues: jest.fn(),
  getAlertRecipientViewData: jest.fn()
}))

jest.mock('../../../app/routes/schemas/user-schema', () => ({
  validate: jest.fn()
}))

jest.mock('../../../app/routes/schemas/remove-user-schema', () => ({
  validate: jest.fn()
}))

jest.mock('../../../app/alerts/update-alert-user', () => ({
  updateAlertUser: jest.fn()
}))

const { normaliseValues, getAlertRecipientViewData } = require('../../../app/alerts/get-alert-recipient-view-data')
const userSchema = require('../../../app/routes/schemas/user-schema')
const removeUserSchema = require('../../../app/routes/schemas/remove-user-schema')
const { updateAlertUser } = require('../../../app/alerts/update-alert-user')
const {
  handleAlertingError,
  formatAlertType,
  getValidationError,
  getAccountName,
  getSchemeName,
  getSchemeSummaries,
  validateUserPayload,
  validateRemovePayload,
  getValidationRedirect,
  createConfirmationView,
  createSaveRoute
} = require('../../../app/alerts/alert-route-helpers')

describe('alert-route-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    normaliseValues.mockImplementation((value) =>
      Array.isArray(value) ? value : [value]
    )
  })

  test('handleAlertingError returns Boom object unchanged when error is already Boom', () => {
    const boomError = { isBoom: true, message: 'boom' }
    expect(handleAlertingError(boomError)).toBe(boomError)
  })

  test('handleAlertingError wraps non-Boom errors in a badGateway Boom error', () => {
    const error = new Error('service unavailable')
    const result = handleAlertingError(error)

    expect(result.isBoom).toBe(true)
    expect(result.output.statusCode).toBe(502)
    expect(result.message).toContain('Alerting Service is unavailable')
    expect(result.message).toContain('service unavailable')
  })

  test('formatAlertType converts underscore strings into capitalised words', () => {
    expect(formatAlertType('EMAIL_DAILY')).toBe('Email Daily')
    expect(formatAlertType('')).toBe('')
    expect(formatAlertType('SINGLE')).toBe('Single')
  })

  test('getValidationError returns concatenated detail messages if present', () => {
    const error = { details: [{ message: 'first' }, { message: 'second' }] }
    expect(getValidationError(error)).toBe('first, second')
  })

  test('getValidationError falls back to message when details absent', () => {
    expect(getValidationError({ message: 'fallback' })).toBe('fallback')
  })

  test('getValidationError falls back to message when details empty', () => {
    expect(getValidationError({ details: [], message: 'empty' })).toBe('empty')
  })

  test('getAccountName returns account.name when present', () => {
    expect(
      getAccountName({ auth: { credentials: { account: { name: 'Tess Ting' } } } })
    ).toBe('Tess Ting')
  })

  test('getAccountName falls back to username or email', () => {
    expect(
      getAccountName({ auth: { credentials: { account: { username: 'bob' } } } })
    ).toBe('bob')

    expect(
      getAccountName({ auth: { credentials: { account: { email: 'carol@example.com' } } } })
    ).toBe('carol@example.com')
  })

  test('getAccountName returns undefined when no account present', () => {
    expect(getAccountName({})).toBeUndefined()
    expect(getAccountName({ auth: {} })).toBeUndefined()
  })

  test('getSchemeName returns the matching scheme name by schemeId', () => {
    const schemes = [
      { schemeId: 1, name: 'Scheme One' },
      { schemeId: '2', name: 'Scheme Two' }
    ]
    expect(getSchemeName(schemes, 1)).toBe('Scheme One')
    expect(getSchemeName(schemes, '2')).toBe('Scheme Two')
  })

  test('getSchemeName returns undefined when not found', () => {
    const schemes = [{ schemeId: 1, name: 'Scheme One' }]
    expect(getSchemeName(schemes, 'missing')).toBeUndefined()
  })

  test('getSchemeSummaries builds summaries using normaliseValues', () => {
    const schemes = [
      { schemeId: 1, name: 'Scheme One' },
      { schemeId: 2, name: 'Scheme Two' }
    ]
    const payload = {
      1: ['EMAIL'],
      2: 'SMS'
    }

    const summaries = getSchemeSummaries(schemes, payload)

    expect(summaries).toEqual([
      { schemeId: 1, schemeName: 'Scheme One', alertTypes: ['EMAIL'] },
      { schemeId: 2, schemeName: 'Scheme Two', alertTypes: ['SMS'] }
    ])
    expect(normaliseValues).toHaveBeenCalledTimes(2)
  })

  describe('validateUserPayload', () => {
    test('returns value when schema validation passes', () => {
      userSchema.validate.mockReturnValue({ error: null })
      const value = { foo: 'bar' }

      expect(validateUserPayload(value)).toBe(value)
    })

    test('throws when schema validation fails', () => {
      const validationError = new Error('invalid')
      userSchema.validate.mockReturnValue({ error: validationError })

      expect(() => validateUserPayload({})).toThrow(validationError)
    })
  })

  describe('validateRemovePayload', () => {
    test('returns value when schema validation passes', () => {
      removeUserSchema.validate.mockReturnValue({ error: null })
      const value = { foo: 'bar' }

      expect(validateRemovePayload(value)).toBe(value)
    })

    test('throws when schema validation fails', () => {
      const validationError = new Error('invalid remove')
      removeUserSchema.validate.mockReturnValue({ error: validationError })

      expect(() => validateRemovePayload({})).toThrow(validationError)
    })
  })

  describe('getValidationRedirect', () => {
    test('builds a redirect query string from payload and validation error', () => {
      const request = {
        payload: {
          name: 'Alice',
          schemeId: ['1', '2'],
          crumb: 'ignored'
        }
      }
      const error = { details: [{ message: 'bad value' }] }

      const result = getValidationRedirect('/alerts/update', request, error)

      expect(result).toBe('/alerts/update?name=Alice&schemeId=1&schemeId=2&validationError=bad+value')
    })

    test('uses error.message when details unavailable', () => {
      const request = { payload: { foo: 'bar' } }
      const error = { message: 'oops' }

      expect(getValidationRedirect('/path', request, error)).toBe('/path?foo=bar&validationError=oops')
    })

    test('encodes special characters and arrays correctly', () => {
      const request = { payload: { email: 'a@b.com', tags: ['x y', 'z'] } }
      const error = { message: 'err msg' }
      expect(getValidationRedirect('/p', request, error)).toBe('/p?email=a%40b.com&tags=x+y&tags=z&validationError=err+msg')
    })

    test('handles missing payload by returning only validationError', () => {
      const request = {}
      const error = { message: 'no payload' }
      expect(getValidationRedirect('/nop', request, error)).toBe('/nop?validationError=no+payload')
    })
  })

  describe('createConfirmationView', () => {
    const route = createConfirmationView(
      '/confirm',
      'alerts/confirm',
      '/form',
      '/form-action',
      'save',
      'Confirm page'
    )

    test('returns route configuration with POST method and auth scope', () => {
      expect(route.method).toBe('POST')
      expect(route.path).toBe('/confirm')
      expect(route.options.auth).toBeDefined()
      expect(route.options.validate.payload).toBe(validateUserPayload)
    })

    test('failAction redirects to the form with validation error query', async () => {
      const request = {
        payload: {
          foo: 'bar',
          crumb: 'ignore-me'
        }
      }
      const h = {
        redirect: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnValue('taken over')
      }
      const error = { details: [{ message: 'validation failed' }] }

      const result = await route.options.validate.failAction(request, h, error)

      expect(h.redirect).toHaveBeenCalledWith('/form?foo=bar&validationError=validation+failed')
      expect(h.takeover).toHaveBeenCalled()
      expect(result).toBe('taken over')
    })

    test('handler renders confirmation view with computed schemeName and schemes summary', async () => {
      const request = {
        payload: { emailAddress: 'test@example.com' }
      }
      const data = {
        schemesPayload: [{ schemeId: 'S1', name: 'Scheme 1' }],
        schemeId: 'S1',
        alertTypesPayload: []
      }
      getAlertRecipientViewData.mockResolvedValue(data)

      const h = { view: jest.fn().mockReturnValue('rendered') }

      const result = await route.handler(request, h)

      expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
      expect(h.view).toHaveBeenCalledWith('alerts/confirm', expect.objectContaining({
        action: 'save',
        pageTitle: 'Confirm page',
        formPath: '/form',
        formAction: '/form-action',
        schemeId: 'S1',
        schemeName: 'Scheme 1',
        schemes: expect.any(Array),
        formatAlertType: expect.any(Function)
      }))
      expect(result).toBe('rendered')
    })

    test('handler returns handleAlertingError result when getAlertRecipientViewData rejects', async () => {
      const request = { payload: {} }
      getAlertRecipientViewData.mockRejectedValue(new Error('recipient fail'))
      const result = await route.handler(request, {})

      expect(result.isBoom).toBe(true)
      expect(result.output.statusCode).toBe(502)
      expect(result.message).toContain('Alerting Service is unavailable')
      expect(result.message).toContain('recipient fail')
    })

    test('handler computes undefined schemeName when no schemeId present', async () => {
      const request = { payload: {} }
      const data = {
        schemesPayload: [{ schemeId: 'S1', name: 'Scheme 1' }],
        schemeId: undefined,
        alertTypesPayload: []
      }
      getAlertRecipientViewData.mockResolvedValue(data)

      const h = { view: jest.fn().mockReturnValue('rendered') }

      const result = await route.handler(request, h)

      expect(getAlertRecipientViewData).toHaveBeenCalledWith(request)
      expect(h.view).toHaveBeenCalledWith('alerts/confirm', expect.objectContaining({
        schemeId: undefined,
        schemeName: undefined
      }))
      expect(result).toBe('rendered')
    })
  })

  describe('createSaveRoute', () => {
    test('handler passes account name, payload and redirect path to updateAlertUser', async () => {
      const route = createSaveRoute(
        '/save',
        'update',
        '/redirect'
      )
      const request = {
        payload: { email: 'test@example.com' },
        auth: { credentials: { account: { name: 'Tess Ting' } } }
      }
      updateAlertUser.mockResolvedValue('saved')

      const result = await route.handler(request, 'h-object')

      expect(updateAlertUser).toHaveBeenCalledWith(
        'Tess Ting',
        { email: 'test@example.com', action: 'update' },
        'h-object',
        '/redirect',
        expect.any(Function)
      )
      expect(result).toBe('saved')
    })

    test('handler resolves redirect path function before calling updateAlertUser', async () => {
      const redirectPath = jest.fn().mockResolvedValue('/computed-redirect')
      const route = createSaveRoute(
        '/save',
        'update',
        redirectPath
      )
      const request = {
        payload: { email: 'test@example.com' },
        auth: { credentials: { account: { name: 'Tess Ting' } } }
      }
      updateAlertUser.mockResolvedValue('saved')

      await route.handler(request, 'h-object')

      expect(redirectPath).toHaveBeenCalledWith(request)
      expect(updateAlertUser).toHaveBeenCalledWith(
        'Tess Ting',
        { email: 'test@example.com', action: 'update' },
        'h-object',
        '/computed-redirect',
        expect.any(Function)
      )
    })

    test('handler passes a validation callback that uses getValidationRedirect', async () => {
      const route = createSaveRoute(
        '/save',
        'update',
        '/redirect'
      )
      const request = {
        payload: { email: 'test@example.com' },
        auth: { credentials: { account: { name: 'Tess Ting' } } }
      }
      updateAlertUser.mockResolvedValue('saved')

      await route.handler(request, 'h-object')

      const callback = updateAlertUser.mock.calls[0][4]
      const redirect = callback({ details: [{ message: 'bad' }] })

      expect(redirect).toBe('/save?email=test%40example.com&validationError=bad')
    })
  })
})
