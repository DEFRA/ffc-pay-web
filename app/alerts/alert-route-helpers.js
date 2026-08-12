const { Boom } = require('@hapi/boom')
const { applicationAdmin, alertAdmin } = require('../auth/permissions')
const { normaliseValues, getAlertRecipientViewData } = require('./get-alert-recipient-view-data')
const userSchema = require('../routes/schemas/user-schema')
const removeUserSchema = require('../routes/schemas/remove-user-schema')
const { updateAlertUser } = require('./update-alert-user')
const AUTH_SCOPE = { scope: [applicationAdmin, alertAdmin] }

const paths = {
  manage: '/alerts/manage',
  manageByScheme: '/alerts/manage-by-scheme',
  manageByRecipient: '/alerts/manage-by-recipient',
  alertsByScheme: '/alerts/by-scheme',
  information: '/alerts/information',
  update: '/alerts/update',
  updateConfirm: '/alerts/update-confirm',
  addRecipientByScheme: '/alerts/add-recipient-by-scheme',
  addRecipientBySchemeConfirm: '/alerts/add-recipient-by-scheme-confirm',
  removeConfirm: '/alerts/confirm-delete',
  updateByRecipient: '/alerts/update-by-recipient',
  removeByRecipient: '/alerts/remove-by-recipient'
}

const views = {
  manage: 'alerts/manage',
  manageByScheme: 'alerts/manage-by-scheme',
  manageByRecipient: 'alerts/manage-by-recipient',
  alertsByScheme: 'alerts/by-scheme',
  information: 'alerts/information',
  update: 'alerts/update',
  updateConfirm: 'alerts/update-confirm',
  addRecipientByScheme: 'alerts/add-recipient-by-scheme',
  addRecipientBySchemeConfirm: 'alerts/add-recipient-by-scheme-confirm',
  removeConfirm: 'alerts/confirm-delete',
  updateByRecipient: 'alerts/update-by-recipient',
  removeByRecipient: 'alerts/remove-by-recipient'
}

const handleAlertingError = (error) => {
  console.error('Alerting Service error:', error)

  if (error.isBoom) {
    return error
  }

  return Boom.badGateway(`Alerting Service is unavailable: ${error.message}`)
}

const formatAlertType = (alertType = '') =>
  alertType
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ')

const getValidationError = (error) =>
  error.details?.map((detail) => detail.message).join(', ') || error.message

const getAccountName = (request) => {
  const account = request.auth?.credentials?.account
  return account?.name || account?.username || account?.email
}

const getSchemeName = (schemes, schemeId) =>
  schemes.find(
    (scheme) => String(scheme.schemeId) === String(schemeId)
  )?.name

const getSchemeSummaries = (schemes, payload) =>
  schemes.map((scheme) => ({
    schemeId: scheme.schemeId,
    schemeName: scheme.name,
    alertTypes: normaliseValues(payload[scheme.schemeId])
  }))

const validateUserPayload = (value) => {
  const { error } = userSchema.validate(value)

  if (error) {
    throw error
  }

  return value
}

const validateRemovePayload = (value) => {
  const { error } = removeUserSchema.validate(value)

  if (error) {
    throw error
  }

  return value
}

const getValidationRedirect = (path, request, error) => {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(request.payload || {})) {
    if (key === 'crumb') {
      continue
    }

    for (const item of normaliseValues(value)) {
      query.append(key, item)
    }
  }

  query.set('validationError', getValidationError(error))

  return `${path}?${query.toString()}`
}

const createConfirmationView = (
  confirmPath,
  confirmView,
  formPath,
  formAction,
  action,
  pageTitle
) => ({
  method: 'POST',
  path: confirmPath,
  options: {
    auth: AUTH_SCOPE,
    validate: {
      payload: validateUserPayload,
      failAction: async (request, h, error) =>
        h
          .redirect(getValidationRedirect(formPath, request, error))
          .takeover()
    }
  },
  handler: async (request, h) => {
    try {
      const data = await getAlertRecipientViewData(request)
      const schemeId = request.payload.schemeId || data.schemeId
      const schemeName = schemeId
        ? getSchemeName(data.schemesPayload, schemeId)
        : undefined

      return h.view(confirmView, {
        ...data,
        action,
        pageTitle,
        formPath,
        formAction,
        schemeId,
        schemeName,
        schemes: getSchemeSummaries(
          data.schemesPayload,
          request.payload
        ),
        formatAlertType
      })
    } catch (error) {
      return handleAlertingError(error)
    }
  }
})

const createSaveRoute = (path, action, redirectPath) => ({
  method: 'POST',
  path,
  options: {
    auth: AUTH_SCOPE
  },
  handler: async (request, h) => {
    const resolvedRedirectPath =
      typeof redirectPath === 'function'
        ? await redirectPath(request)
        : redirectPath

    return updateAlertUser(
      getAccountName(request),
      {
        ...request.payload,
        action
      },
      h,
      resolvedRedirectPath,
      (error) => getValidationRedirect(path, request, error)
    )
  }
})

module.exports = {
  AUTH_SCOPE,
  paths,
  views,
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
}
