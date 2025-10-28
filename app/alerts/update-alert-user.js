const { postAlerting, getAlertingData } = require('../api')
const { BAD_REQUEST } = require('../constants/http-status-codes')
const { getAlertUpdateViewData } = require('./get-alert-update-view-data')

const updateAlertUser = async (modifiedBy, payload, h) => {
  const { emailAddress, contactId } = payload
  const emailCheckEndpoint = `/contact/email/${encodeURIComponent(emailAddress)}`

  const emailCheckResponse = await getAlertingData(emailCheckEndpoint)
  if (emailCheckResponse?.payload?.contact?.contactId && emailCheckResponse?.payload?.contact?.contactId !== Number(contactId)) {
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

  const data = {
    emailAddress,
    modifiedBy
  }

  if (contactId && contactId !== '') {
    data.contactId = contactId
  }

  for (const key of Object.keys(payload)) {
    if (key === 'contactId' || key === 'emailAddress') {
      continue
    }

    const value = payload[key]

    let alertTypes = []

    if (typeof value === 'string') {
      alertTypes = [value]
    } else if (Array.isArray(value)) {
      alertTypes = value
    } else {
      continue
    }

    for (const alertType of alertTypes) {
      if (!data[alertType]) {
        data[alertType] = []
      }
      data[alertType].push(Number(key))
    }
  }

  await postAlerting('/update-contact', data, null)
  return h.redirect('/alerts')
}

module.exports = {
  updateAlertUser
}
