const { getAlertingData } = require('../../api')

const isEmailTaken = async (emailAddress, contactId) => {
  const emailCheckEndpoint = `/contact/email/${encodeURIComponent(emailAddress)}`
  const emailCheckResponse = await getAlertingData(emailCheckEndpoint)
  const existingContactId = emailCheckResponse?.payload?.contact?.contactId
  return !!existingContactId && existingContactId !== Number(contactId)
}

module.exports = {
  isEmailTaken
}
