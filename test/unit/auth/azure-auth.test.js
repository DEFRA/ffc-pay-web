const mockRoles = ['test-role']
const mockAccount = 'test-account'
const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn().mockImplementation(() => {
  return {
    idTokenClaims: {
      roles: mockRoles
    },
    account: mockAccount
  }
})
const mockAcquireTokenSilent = jest.fn().mockImplementation(() => {
  return {
    idTokenClaims: {
      roles: mockRoles
    },
    account: mockAccount
  }
})
const mockRemoveAccount = jest.fn()
const mockGetTokenCache = jest.fn().mockImplementation(() => {
  return {
    removeAccount: mockRemoveAccount
  }
})
jest.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: jest.fn().mockImplementation(() => {
      return {
        getAuthCodeUrl: mockGetAuthCodeUrl,
        acquireTokenByCode: mockAcquireTokenByCode,
        acquireTokenSilent: mockAcquireTokenSilent,
        getTokenCache: mockGetTokenCache
      }
    }),
    LogLevel: {
      Verbose: 'verbose'
    }
  }
})

let mockCookieAuth
let azureAuth
let msal
let authConfig

describe('azure-auth in non-prod / non-test mode (logging verbose)', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('../../../app/config', () => ({
      authConfig: { redirectUrl: 'my-redirect-url', azure: {} },
      isProd: false,
      isTest: false
    }))

    mockCookieAuth = { set: jest.fn() }

    azureAuth = require('../../../app/auth/azure-auth')
    msal = require('@azure/msal-node')
    authConfig = require('../../../app/config').authConfig
  })

  test('getAuthenticationUrl should call getAuthCodeUrl once', () => {
    azureAuth.getAuthenticationUrl()
    expect(mockGetAuthCodeUrl).toHaveBeenCalledTimes(1)
  })

  test('getAuthenticationUrl should pass prompt and redirectUri', () => {
    azureAuth.getAuthenticationUrl()
    const params = mockGetAuthCodeUrl.mock.calls[0][0]
    expect(params.prompt).toBe('select_account')
    expect(params.redirectUri).toBe(authConfig.redirectUrl)
  })

  test('authenticate calls acquireTokenByCode and sets cookieAuth', async () => {
    await azureAuth.authenticate('redirectCode', mockCookieAuth)
    expect(mockAcquireTokenByCode).toHaveBeenCalledTimes(1)
    const args = mockAcquireTokenByCode.mock.calls[0][0]
    expect(args.code).toBe('redirectCode')
    expect(args.redirectUri).toBe(authConfig.redirectUrl)
    expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    expect(mockCookieAuth.set.mock.calls[0][0].scope).toBe(mockRoles)
    expect(mockCookieAuth.set.mock.calls[0][0].account).toBe(mockAccount)
  })

  test('refresh calls acquireTokenSilent, sets cookieAuth, returns roles', async () => {
    const result = await azureAuth.refresh(mockAccount, mockCookieAuth)
    expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
    const args = mockAcquireTokenSilent.mock.calls[0][0]
    expect(args.account).toBe(mockAccount)
    expect(args.forceRefresh).toBeTruthy()
    expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    expect(mockCookieAuth.set.mock.calls[0][0].scope).toBe(mockRoles)
    expect(mockCookieAuth.set.mock.calls[0][0].account).toBe(mockAccount)
    expect(result).toBe(mockRoles)
  })

  test('refresh with forceRefresh = false uses false', async () => {
    await azureAuth.refresh(mockAccount, mockCookieAuth, false)
    const args = mockAcquireTokenSilent.mock.calls[0][0]
    expect(args.forceRefresh).not.toBeTruthy()
  })

  test('logout calls removeAccount with account', async () => {
    await azureAuth.logout(mockAccount)
    expect(mockRemoveAccount).toHaveBeenCalledTimes(1)
    expect(mockRemoveAccount).toHaveBeenCalledWith(mockAccount)
  })

  test('msalLogging should be verbose loggerOptions object', () => {
    expect(msal.ConfidentialClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.objectContaining({
          loggerOptions: expect.objectContaining({
            loggerCallback: expect.any(Function),
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose
          })
        })
      })
    )
  })
})

describe('azure-auth in prod or test mode (logging turned off)', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('../../../app/config', () => ({
      authConfig: { redirectUrl: 'my-redirect-url', azure: {} },
      isProd: true,
      isTest: false
    }))

    mockCookieAuth = { set: jest.fn() }

    azureAuth = require('../../../app/auth/azure-auth')
    msal = require('@azure/msal-node')
  })

  test('msalLogging should be empty object', () => {
    expect(msal.ConfidentialClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.objectContaining({
          loggerOptions: {}
        })
      })
    )
  })

  test('getAuthenticationUrl still calls getAuthCodeUrl', () => {
    azureAuth.getAuthenticationUrl()
    expect(mockGetAuthCodeUrl).toHaveBeenCalledTimes(1)
  })

  test('authenticate still sets cookieAuth', async () => {
    await azureAuth.authenticate('code', mockCookieAuth)
    expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    expect(mockCookieAuth.set.mock.calls[0][0].scope).toBe(mockRoles)
    expect(mockCookieAuth.set.mock.calls[0][0].account).toBe(mockAccount)
  })

  test('refresh still works', async () => {
    const result = await azureAuth.refresh(mockAccount, mockCookieAuth)
    expect(result).toBe(mockRoles)
    expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
  })

  test('logout still calls removeAccount', async () => {
    await azureAuth.logout(mockAccount)
    expect(mockRemoveAccount).toHaveBeenCalledWith(mockAccount)
  })
})
