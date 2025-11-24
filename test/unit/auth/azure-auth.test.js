const mockRoles = ['test-role']
const mockAccount = 'test-account'

const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn().mockResolvedValue({
  idTokenClaims: { roles: mockRoles },
  account: mockAccount
})
const mockAcquireTokenSilent = jest.fn().mockResolvedValue({
  idTokenClaims: { roles: mockRoles },
  account: mockAccount
})
const mockRemoveAccount = jest.fn()
const mockGetTokenCache = jest.fn(() => ({ removeAccount: mockRemoveAccount }))

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn(() => ({
    getAuthCodeUrl: mockGetAuthCodeUrl,
    acquireTokenByCode: mockAcquireTokenByCode,
    acquireTokenSilent: mockAcquireTokenSilent,
    getTokenCache: mockGetTokenCache
  })),
  LogLevel: { Verbose: 'verbose' }
}))

const azureAuth = require('../../../app/auth/azure-auth')
const { authConfig } = require('../../../app/config')

let mockCookieAuth

describe('azure authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookieAuth = { set: jest.fn() }
  })

  describe('getAuthenticationUrl', () => {
    beforeEach(() => {
      azureAuth.getAuthenticationUrl()
    })

    test('calls getAuthCodeUrl once', () => {
      expect(mockGetAuthCodeUrl).toHaveBeenCalledTimes(1)
    })

    test('forces select_account prompt', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].prompt).toBe('select_account')
    })

    test('uses redirect url from config', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].redirectUri).toBe(authConfig.redirectUrl)
    })
  })

  describe('authenticate', () => {
    beforeEach(async () => {
      await azureAuth.authenticate('redirectCode', mockCookieAuth)
    })

    test('calls acquireTokenByCode once', () => {
      expect(mockAcquireTokenByCode).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['code', 'redirectCode'],
      ['redirectUri', authConfig.redirectUrl]
    ])('passes %s correctly', (key, expected) => {
      expect(mockAcquireTokenByCode.mock.calls[0][0][key]).toBe(expected)
    })

    test('sets cookieAuth once', () => {
      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['scope', mockRoles],
      ['account', mockAccount]
    ])('sets %s correctly', (key, expected) => {
      expect(mockCookieAuth.set.mock.calls[0][0][key]).toBe(expected)
    })
  })

  describe('refresh', () => {
    test('calls acquireTokenSilent once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockAcquireTokenSilent.mock.calls[0][0].account).toBe(mockAccount)
    })

    test.each([
      [undefined, true],
      [true, true],
      [false, false]
    ])('forceRefresh=%s results in %s', async (force, expected) => {
      await azureAuth.refresh(mockAccount, mockCookieAuth, force)
      expect(mockAcquireTokenSilent.mock.calls[0][0].forceRefresh).toBe(expected)
    })

    test('sets cookieAuth once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['scope', mockRoles],
      ['account', mockAccount]
    ])('sets %s correctly', async (key, expected) => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockCookieAuth.set.mock.calls[0][0][key]).toBe(expected)
    })

    test('returns roles', async () => {
      const result = await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(result).toBe(mockRoles)
    })
  })

  describe('logout', () => {
    beforeEach(async () => {
      await azureAuth.logout(mockAccount)
    })

    test('calls removeAccount once', () => {
      expect(mockRemoveAccount).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', () => {
      expect(mockRemoveAccount).toHaveBeenCalledWith(mockAccount)
    })
  })
})
