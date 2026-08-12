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

const getAlertRecipientViewData = async (request, options = {}) => {
  const { loadContact = false } = options
  const { sanitizedSchemesPayload, alertTypesPayload } =
    await getAlertTypesAndSchemes()

  const query = request.query ?? {}
  const payload = request.payload ?? {}

  const contactId = query.contactId || payload.contactId
  const emailAddress = query.emailAddress || payload.emailAddress
  const schemeId = query.schemeId || payload.schemeId
  const action = query.action || payload.action

  let contactPayload = {}

  if (loadContact && (contactId || emailAddress)) {
    const response = await getAlertingData(
      `/contact/${encodeURIComponent(contactId || emailAddress)}`
    )

    contactPayload = response?.payload?.contact ?? {}
  }

  const schemesPayload = schemeId
    ? sanitizedSchemesPayload.filter(
      scheme => String(scheme.schemeId) === String(schemeId)
    )
    : sanitizedSchemesPayload

  const selectedAlerts = {}

  for (const alertType of alertTypesPayload) {
    selectedAlerts[alertType] = {}

    for (const selectedSchemeId of normaliseValues(
      contactPayload[alertType]
    )) {
      selectedAlerts[alertType][selectedSchemeId] = true
    }

    for (const selectedScheme of schemesPayload) {
      for (const selectedAlertType of getSelectedValues(
        query,
        payload,
        selectedScheme.schemeId
      )) {
        if (selectedAlertType === alertType) {
          selectedAlerts[alertType][selectedScheme.schemeId] = true
        }
      }
    }
  }

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
