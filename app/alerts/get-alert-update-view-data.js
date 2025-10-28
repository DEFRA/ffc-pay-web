const { getAlertingData } = require('../api')
const { getAlertTypesAndSchemes } = require('./get-alert-types-and-schemes')

const getAlertUpdateViewData = async (request) => {
  const { sanitizedSchemesPayload, alertTypesPayload } = await getAlertTypesAndSchemes()

  const user = request.auth?.credentials.account
  const userNameOrEmail = user?.name || user?.username || user?.email

  const contactId = request.query?.contactId

  let contactPayload = {}

  if (contactId) {
    const contact = await getAlertingData(`/contact/contactId/${encodeURIComponent(contactId)}`)
    contactPayload = contact?.payload?.contact ?? {}
    console.log(`User ${userNameOrEmail} has accessed the amend alert recipient page for ${contactPayload?.emailAddress}`)
  } else {
    console.log(`User ${userNameOrEmail} has accessed the amend alert recipient page for a new user`)
  }

  const { emailAddress } = contactPayload

  const selectedAlerts = {}

  alertTypesPayload.forEach(alertType => {
    const schemesForAlert = contactPayload[alertType] || []
    selectedAlerts[alertType] = {}

    schemesForAlert.forEach(schemeId => {
      selectedAlerts[alertType][schemeId] = true
    })
  })

  return { schemesPayload: sanitizedSchemesPayload, alertTypesPayload, contactId, emailAddress, selectedAlerts }
}

module.exports = {
  getAlertUpdateViewData
}
