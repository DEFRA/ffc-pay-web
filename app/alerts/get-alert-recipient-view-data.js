const { getAlertingData } = require('../api')
const { getAlertTypesAndSchemes } = require('./get-alert-types-and-schemes')

const normaliseValues = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return value ? [value] : []
}

const getSelectedValues = (query, payload, key) => [
  ...normaliseValues(query[key]),
  ...normaliseValues(payload[key])
]

const getContactPayload = async (loadContact, contactId, emailAddress) => {
  if (!loadContact || !(contactId || emailAddress)) {
    return {}
  }

  const response = await getAlertingData(
    `/contact/${encodeURIComponent(contactId || emailAddress)}`
  )

  return response?.payload?.contact ?? {}
}

const getSchemesPayload = (sanitizedSchemesPayload, schemeId) =>
  schemeId
    ? sanitizedSchemesPayload.filter(
      (scheme) => String(scheme.schemeId) === String(schemeId)
    )
    : sanitizedSchemesPayload

const buildSelectedAlerts = (
  alertTypesPayload,
  schemesPayload,
  query,
  payload,
  contactPayload
) =>
  alertTypesPayload.reduce((selectedAlerts, alertType) => {
    selectedAlerts[alertType] = Object.fromEntries(
      normaliseValues(contactPayload[alertType]).map((selectedSchemeId) => [
        selectedSchemeId,
        true
      ])
    )

    schemesPayload.forEach((selectedScheme) =>
      getSelectedValues(query, payload, selectedScheme.schemeId).forEach(
        (selectedAlertType) => {
          if (selectedAlertType === alertType) {
            selectedAlerts[alertType][selectedScheme.schemeId] = true
          }
        }
      )
    )

    return selectedAlerts
  }, {})

const getAlertRecipientViewData = async (request, options = {}) => {
  const { loadContact = false } = options
  const { sanitizedSchemesPayload, alertTypesPayload } =
    await getAlertTypesAndSchemes()

  const query = request.query ?? {}
  const payload = request.payload ?? {}
  const contactId = query.contactId || payload.contactId
  const emailAddress = query.emailAddress || payload.emailAddress
  const schemeId = query.schemeId ?? payload.schemeId
  const action = query.action || payload.action

  const contactPayload = await getContactPayload(
    loadContact,
    contactId,
    emailAddress
  )

  const schemesPayload = getSchemesPayload(sanitizedSchemesPayload, schemeId)
  const selectedAlerts = buildSelectedAlerts(
    alertTypesPayload,
    schemesPayload,
    query,
    payload,
    contactPayload
  )

  return {
    schemesPayload,
    alertTypesPayload,
    selectedAlerts,
    contactId: contactId || contactPayload.contactId,
    emailAddress: emailAddress || contactPayload.emailAddress,
    schemeId,
    action
  }
}

module.exports = {
  getAlertRecipientViewData,
  normaliseValues
}
