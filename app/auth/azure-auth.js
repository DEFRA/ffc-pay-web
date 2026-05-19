const config = require('../config')
const msal = require('@azure/msal-node')

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

const getAuthenticationUrl = () => {
  const authCodeUrlParameters = {
    prompt: 'select_account', // Force the MS account select dialog
    redirectUri: config.authConfig.redirectUrl
  }

  return msalClientApplication.getAuthCodeUrl(authCodeUrlParameters)
}

const authenticate = async (redirectCode, cookieAuth) => {
  try {
    const token = await msalClientApplication.acquireTokenByCode({
      code: redirectCode,
      redirectUri: config.authConfig.redirectUrl,
      scopes: ['openid', 'profile', 'offline_access']
    })

    cookieAuth.set({
      scope: token.idTokenClaims.roles || [],
      account: token.account
    })
  } catch (err) {
    console.error('Failed to acquire token by code:', err)
  }
}

const refresh = async (account, cookieAuth, forceRefresh = true) => {
  try {
    const token = await msalClientApplication.acquireTokenSilent({
      account,
      scopes: ['openid', 'profile', 'offline_access'],
      forceRefresh
    })

    cookieAuth.set({
      scope: token.idTokenClaims.roles || [],
      account: token.account
    })

    return token.idTokenClaims.roles
  } catch (err) {
    console.error('Failed to acquire token on silent refresh:', err)
  }
}

const logout = async (account) => {
  try {
    await msalClientApplication.getTokenCache().removeAccount(account)
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
