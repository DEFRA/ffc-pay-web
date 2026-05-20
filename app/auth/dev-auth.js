const { applicationAdmin } = require('./permissions')
const { randomUUID } = require('node:crypto')
const devAccount = require('./dev-account')
const devAuthRoles = [applicationAdmin]

const getAuthenticationUrl = () => {
  return '/dev-auth'
}

const authenticate = async (_redirectCode, cookieAuth) => {
  cookieAuth.set({
    scope: devAuthRoles,
    account: devAccount
  })
}

const refresh = async (_account, cookieAuth, _forceRefresh = true) => {
  cookieAuth.set({
    scope: devAuthRoles,
    account: devAccount
  })

  return devAuthRoles
}

const logout = async (_account) => {
  devAccount.homeAccountId = randomUUID()
}

module.exports = {
  getAuthenticationUrl,
  authenticate,
  refresh,
  logout
}
