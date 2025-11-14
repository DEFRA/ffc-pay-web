const { postAlerting, getAlertingData } = require('../api')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { getAlertUpdateViewData } = require('./get-alert-update-view-data')
const { isEmailTaken, isEmailBlocked } = require('./validation')

const addAlertTypeToData = (data, alertType, keyNumber) => {
  if (!data[alertType]) {
    data[alertType] = []
  }
  data[alertType].push(keyNumber)
}

const processPayloadEntry = async (data, key, value) => {
  if (key === 'contactId' || key === 'emailAddress') {
    return
  }

  if (typeof value !== 'string' && !Array.isArray(value)) {
    return
  }

  let alertTypes = typeof value === 'string' ? [value] : value

  const allAlertTypes = await getAlertingData('/alert-types')
  const allAlertTypesPayload = allAlertTypes?.payload?.alertTypes ?? []
  if (alertTypes.includes('all')) {
    alertTypes = allAlertTypesPayload
  }
  for (const alertType of alertTypes) {
    addAlertTypeToData(data, alertType, Number(key))
  }
}

const buildUpdateData = async (payload, contactId, modifiedBy) => {
  const data = {
    emailAddress: payload.emailAddress,
    modifiedBy
  }

  if (contactId && contactId !== '') {
    data.contactId = contactId
  }

  delete payload.selectView
  delete payload.action

  for (const [key, value] of Object.entries(payload)) {
    await processPayloadEntry(data, key, value)
  }

  const alertTypeKeys = Object.keys(data).filter(
    key => !['emailAddress', 'contactId', 'modifiedBy'].includes(key)
  )
  const allEmpty = alertTypeKeys.every(key => Array.isArray(data[key]) && data[key].length === 0)

  if (alertTypeKeys.length === 0 || (alertTypeKeys.length > 0 && allEmpty)) {
    throw new Error('At least one alert type must be selected.')
  }

  return data
}

const returnErrorView = async (h, contactId, modifiedBy, error) => {
  const minimalRequest = {
    query: { contactId },
    auth: { credentials: { account: { name: modifiedBy } } }
  }
  const viewData = await getAlertUpdateViewData(minimalRequest)

  return h
    .view(
      'alerts/update',
      { ...viewData, error }
    )
    .code(BAD_REQUEST)
    .takeover()
}

const updateAlertUser = async (modifiedBy, payload, h) => {
  const { emailAddress, contactId } = payload

  try {
    await isEmailTaken(emailAddress, contactId)
    isEmailBlocked(emailAddress)

    const data = await buildUpdateData(payload, contactId, modifiedBy)

    await postAlerting('/update-contact', data, null)
    return h.redirect('/alerts')
  } catch (err) {
    return returnErrorView(h, contactId, modifiedBy, err)
  }
}

module.exports = {
  updateAlertUser
}
