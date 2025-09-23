const isInRole = require('./is-in-role')
const { applicationAdmin, schemeAdmin, holdAdmin, dataView, closureAdmin, statusReportSfi23, statusReportsDelinked, manualPaymentsAdmin } = require('./permissions')

const mapAuth = (request) => {
  return {
    isAuthenticated: request.auth.isAuthenticated,
    isAnonymous: !request.auth.isAuthenticated,
    isApplicationAdmin: request.auth.isAuthenticated && isInRole(request.auth.credentials, applicationAdmin),
    isSchemeAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, schemeAdmin),
    isHoldAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, holdAdmin),
    isDataViewUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, dataView),
    isClosureAdminUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, closureAdmin),
    isStatusReportUser: request.auth.isAuthenticated && (isInRole(request.auth.credentials, statusReportSfi23) || isInRole(request.auth.credentials, statusReportsDelinked)),
    isManualPaymentsUser: request.auth.isAuthenticated && (isInRole(request.auth.credentials, manualPaymentsAdmin))
  }
}

module.exports = mapAuth
