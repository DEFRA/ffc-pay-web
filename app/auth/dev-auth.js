const { holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked } = require('./permissions')
const { v4: uuidv4 } = require('uuid')
const devAccount = require('./dev-account')

const getAuthenticationUrl = () => {
  return '/dev-auth'
}

const authenticate = async (_redirectCode, cookieAuth) => {
  cookieAuth.set({
    scope: [holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked],
    account: devAccount
  })
}

const refresh = async (_account, cookieAuth, _forceRefresh = true) => {
  cookieAuth.set({
    scope: [holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked],
    account: devAccount
  })

  return [holdAdmin, schemeAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked]
}

const logout = async (_account) => {
  devAccount.homeAccountId = uuidv4()
}

module.exports = {
  getAuthenticationUrl,
  authenticate,
  refresh,
  logout
}
