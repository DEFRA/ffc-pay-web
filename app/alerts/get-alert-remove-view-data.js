const { getAlertingData } = require('../api')

const getAlertRemoveViewData = async (request) => {
  const user = request.auth?.credentials.account
  const userNameOrEmail = user?.name || user?.username || user?.email

  const contactId = request.query?.contactId
  const emailForSearch = request.query?.emailAddress

  let contactPayload = {}

  if (contactId || emailForSearch) {
    const contact = await getAlertingData(`/contact/${encodeURIComponent(contactId ?? emailForSearch)}`)
    contactPayload = contact?.payload?.contact ?? {}
    console.log(`User ${userNameOrEmail} has accessed the remove alert recipient page for ${contactPayload?.emailAddress}`)
  }

  const { emailAddress } = contactPayload

  return { contactId: contactId ?? contactPayload.contactId, emailAddress }
}

module.exports = {
  getAlertRemoveViewData
}
