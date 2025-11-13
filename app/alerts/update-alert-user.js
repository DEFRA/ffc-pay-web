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

  for (const [key, value] of Object.entries(payload)) {
    await processPayloadEntry(data, key, value)
  }

  return data
}

const updateAlertUser = async (modifiedBy, payload, h) => {
  const { emailAddress, contactId } = payload
  const emailTaken = await isEmailTaken(emailAddress, contactId)
  const emailBlocked = isEmailBlocked(emailAddress)
  if (emailTaken || emailBlocked) {
    const error = emailTaken ? `The email address ${emailAddress} is already registered` : `The email address ${emailAddress} is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.`
    const minimalRequest = {
      query: { contactId },
      auth: { credentials: { account: { name: modifiedBy } } }
    }
    const viewData = await getAlertUpdateViewData(minimalRequest)

    return h
      .view(
        'alerts/update',
        { ...viewData, error: new Error(error) }
      )
      .code(BAD_REQUEST)
      .takeover()
  }

  const data = await buildUpdateData(payload, contactId, modifiedBy)

  await postAlerting('/update-contact', data, null)
  return h.redirect('/alerts')
}

module.exports = {
  updateAlertUser
}
