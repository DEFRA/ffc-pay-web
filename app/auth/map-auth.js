const isInRole = require('./is-in-role')
const { schemeAdmin, holdAdmin, dataView, closureAdmin } = require('./permissions')

const mapAuth = (request) => {
  return {
    isAuthenticated: request.auth.isAuthenticated,
    isAnonymous: !request.auth.isAuthenticated,
    isSchemeAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, schemeAdmin),
    isHoldAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, holdAdmin),
    isDataViewUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, dataView),
    isClosureAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, closureAdmin)
  }
}

module.exports = mapAuth
