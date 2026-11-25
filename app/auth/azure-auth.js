const config = require('../config')
const msal = require('@azure/msal-node')

const AUTH_SCOPES = ['openid', 'profile', 'offline_access']

const msalLogging = config.isProd
  ? {}
  : {
      loggerCallback (_loglevel, message, _containsPii) {
        console.log(message)
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose
    }

const msalClientApplication = new msal.ConfidentialClientApplication({
  auth: config.authConfig.azure,
  system: { loggerOptions: msalLogging }
})

const getAuthenticationUrl = () => msalClientApplication.getAuthCodeUrl({
  prompt: 'select_account',
  redirectUri: config.authConfig.redirectUrl,
  scopes: AUTH_SCOPES
})

const getSessionAccount = account => ({
  homeAccountId: account.homeAccountId,
  environment: account.environment,
  tenantId: account.tenantId,
  username: account.username,
  localAccountId: account.localAccountId,
  name: account.name,
  ...(account.email && { email: account.email })
})

const getCachedAccount = async account => {
  if (!account?.homeAccountId) {
    return null
  }
  return msalClientApplication.getTokenCache().getAccountByHomeId(account.homeAccountId)
}

const authenticate = async (redirectCode, cookieAuth) => {
  try {
    if (!redirectCode) {
      throw new Error('No authorization code was returned by Microsoft Entra ID')
    }
    const token = await msalClientApplication.acquireTokenByCode({
      code: redirectCode,
      redirectUri: config.authConfig.redirectUrl,
      scopes: AUTH_SCOPES
    })
    if (!token?.account || !token?.idTokenClaims) {
      throw new Error('Microsoft Entra ID returned an incomplete authentication result')
    }
    cookieAuth.set({
      scope: token.idTokenClaims.roles || [],
      account: getSessionAccount(token.account)
    })
    return token
  } catch (err) {
    console.error('Failed to acquire token by code:', {
      name: err?.name,
      message: err?.message,
      errorCode: err?.errorCode,
      correlationId: err?.correlationId
    })
    throw err
  }
}

const refresh = async (account, cookieAuth, forceRefresh = false) => {
  try {
    const cachedAccount = await getCachedAccount(account)
    if (!cachedAccount) {
      console.warn('Unable to refresh token: account not found in MSAL cache')
      return undefined
    }
    const token = await msalClientApplication.acquireTokenSilent({
      account: cachedAccount,
      scopes: AUTH_SCOPES,
      forceRefresh
    })
    if (!token?.account || !token?.idTokenClaims) {
      throw new Error('Microsoft Entra ID returned an incomplete refresh result')
    }
    cookieAuth.set({
      scope: token.idTokenClaims.roles || [],
      account: getSessionAccount(token.account)
    })
    return token.idTokenClaims.roles
  } catch (err) {
    console.error('Failed to acquire token on silent refresh:', {
      name: err?.name,
      message: err?.message,
      errorCode: err?.errorCode,
      correlationId: err?.correlationId
    })
    return undefined
  }
}

const logout = async account => {
  try {
    const cachedAccount = await getCachedAccount(account)
    if (cachedAccount) {
      await msalClientApplication.getTokenCache().removeAccount(cachedAccount)
    }
  } catch (err) {
    console.error('Unable to end session', err)
  }
}

module.exports = {
  getAuthenticationUrl,
  authenticate,
  refresh,
  logout
}
