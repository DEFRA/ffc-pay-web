const mockRoles = ['test-role']
const mockAccount = {
  homeAccountId: 'home-id',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant-id',
  username: 'test@example.com',
  localAccountId: 'local-id',
  name: 'Test User',
  email: 'test@example.com'
}
const mockFullAccount = { ...mockAccount, idTokenClaims: { roles: mockRoles }, extraField: 'excluded' }
const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn()
const mockAcquireTokenSilent = jest.fn()
const mockGetAccountByHomeId = jest.fn()
const mockRemoveAccount = jest.fn()
const mockGetTokenCache = jest.fn(() => ({
  getAccountByHomeId: mockGetAccountByHomeId,
  removeAccount: mockRemoveAccount
}))

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
const scopes = ['openid', 'profile', 'offline_access']
let cookieAuth

describe('azure authentication', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockGetTokenCache.mockImplementation(() => ({
      getAccountByHomeId: mockGetAccountByHomeId,
      removeAccount: mockRemoveAccount
    }))
    mockGetAccountByHomeId.mockResolvedValue(mockFullAccount)
    mockAcquireTokenByCode.mockResolvedValue({ idTokenClaims: { roles: mockRoles }, account: mockFullAccount })
    mockAcquireTokenSilent.mockResolvedValue({ idTokenClaims: { roles: mockRoles }, account: mockFullAccount })
    cookieAuth = { set: jest.fn() }
  })

  test('getAuthenticationUrl uses consistent scopes', async () => {
    await azureAuth.getAuthenticationUrl()
    expect(mockGetAuthCodeUrl).toHaveBeenCalledWith({
      prompt: 'select_account', redirectUri: authConfig.redirectUrl, scopes
    })
  })

  test('authenticate exchanges code and stores only a reduced account', async () => {
    const result = await azureAuth.authenticate('code', cookieAuth)
    expect(mockAcquireTokenByCode).toHaveBeenCalledWith({
      code: 'code', redirectUri: authConfig.redirectUrl, scopes
    })
    expect(result.account).toBe(mockFullAccount)
    expect(cookieAuth.set).toHaveBeenCalledWith({ scope: mockRoles, account: mockAccount })
    expect(cookieAuth.set.mock.calls[0][0].account).not.toHaveProperty('idTokenClaims')
    expect(cookieAuth.set.mock.calls[0][0].account).not.toHaveProperty('extraField')
  })

  test('authenticate rejects missing code without acquiring a token', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })
    try {
      await expect(azureAuth.authenticate(undefined, cookieAuth)).rejects.toThrow('No authorization code')
      expect(mockAcquireTokenByCode).not.toHaveBeenCalled()
      expect(cookieAuth.set).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test('authenticate rejects an incomplete token', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })
    try {
      mockAcquireTokenByCode.mockResolvedValueOnce({ account: null, idTokenClaims: {} })
      await expect(azureAuth.authenticate('code', cookieAuth)).rejects.toThrow('incomplete authentication result')
      expect(cookieAuth.set).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test('authenticate propagates MSAL errors rather than redirecting silently', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })
    try {
      const error = new Error('token failure')
      mockAcquireTokenByCode.mockRejectedValueOnce(error)
      await expect(azureAuth.authenticate('code', cookieAuth)).rejects.toBe(error)
      expect(cookieAuth.set).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test.each([[undefined, false], [true, true], [false, false]])(
    'refresh with forceRefresh=%s passes %s', async (force, expected) => {
      await azureAuth.refresh(mockAccount, cookieAuth, force)
      expect(mockGetAccountByHomeId).toHaveBeenCalledWith(mockAccount.homeAccountId)
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({ account: mockFullAccount, scopes, forceRefresh: expected })
      expect(cookieAuth.set).toHaveBeenCalledWith({ scope: mockRoles, account: mockAccount })
    }
  )

  test('refresh returns roles', async () => {
    expect(await azureAuth.refresh(mockAccount, cookieAuth)).toBe(mockRoles)
  })

  test('refresh skips acquisition when account is missing from cache', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { })
    try {
      mockGetAccountByHomeId.mockResolvedValueOnce(null)
      expect(await azureAuth.refresh(mockAccount, cookieAuth)).toBeUndefined()
      expect(mockAcquireTokenSilent).not.toHaveBeenCalled()
      expect(cookieAuth.set).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test('refresh skips lookup without homeAccountId', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { })
    try {
      expect(await azureAuth.refresh({}, cookieAuth)).toBeUndefined()
      expect(mockGetAccountByHomeId).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test('refresh handles token acquisition failure', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })
    try {
      mockAcquireTokenSilent.mockRejectedValueOnce(new Error('silent failure'))
      expect(await azureAuth.refresh(mockAccount, cookieAuth)).toBeUndefined()
      expect(cookieAuth.set).not.toHaveBeenCalled()
    } finally { spy.mockRestore() }
  })

  test('logout removes the complete cached account', async () => {
    await azureAuth.logout(mockAccount)
    expect(mockGetAccountByHomeId).toHaveBeenCalledWith(mockAccount.homeAccountId)
    expect(mockRemoveAccount).toHaveBeenCalledWith(mockFullAccount)
  })

  test('logout does not remove an absent cached account', async () => {
    mockGetAccountByHomeId.mockResolvedValueOnce(null)
    await azureAuth.logout(mockAccount)
    expect(mockRemoveAccount).not.toHaveBeenCalled()
  })
})
