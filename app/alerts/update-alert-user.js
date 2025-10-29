const { postAlerting, getAlertingData } = require('../api')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { getAlertUpdateViewData } = require('./get-alert-update-view-data')

const isEmailTaken = async (emailAddress, contactId) => {
  const emailCheckEndpoint = `/contact/email/${encodeURIComponent(emailAddress)}`
  const emailCheckResponse = await getAlertingData(emailCheckEndpoint)
  const existingContactId = emailCheckResponse?.payload?.contact?.contactId
  return existingContactId && existingContactId !== Number(contactId)
}

const addAlertTypeToData = (data, alertType, keyNumber) => {
  if (!data[alertType]) {
    data[alertType] = []
  }
  data[alertType].push(keyNumber)
}

const processPayloadEntry = (data, key, value) => {
  if (key === 'contactId' || key === 'emailAddress') {
    return
  }

  if (typeof value !== 'string' && !Array.isArray(value)) {
    return
  }

  const alertTypes = typeof value === 'string' ? [value] : value

  for (const alertType of alertTypes) {
    addAlertTypeToData(data, alertType, Number(key))
  }
}

const buildUpdateData = (payload, contactId, modifiedBy) => {
  const data = {
    emailAddress: payload.emailAddress,
    modifiedBy
  }

  if (contactId && contactId !== '') {
    data.contactId = contactId
  }

  for (const [key, value] of Object.entries(payload)) {
    processPayloadEntry(data, key, value)
  }

  return data
}

const updateAlertUser = async (modifiedBy, payload, h) => {
  const { emailAddress, contactId } = payload

  if (await isEmailTaken(emailAddress, contactId)) {
    const minimalRequest = {
      query: { contactId },
      auth: { credentials: { account: { name: modifiedBy } } }
    }
    const viewData = await getAlertUpdateViewData(minimalRequest)

    return h
      .view(
        'alerts/update',
        { ...viewData, error: new Error(`The email address ${emailAddress} is already registered`) }
      )
      .code(BAD_REQUEST)
      .takeover()
  }

  const data = buildUpdateData(payload, contactId, modifiedBy)

  await postAlerting('/update-contact', data, null)
  return h.redirect('/alerts')
}

module.exports = {
  updateAlertUser
}
