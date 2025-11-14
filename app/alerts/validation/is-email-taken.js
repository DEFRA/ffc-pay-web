const { getAlertingData } = require('../../api')

const isEmailTaken = async (emailAddress, contactId) => {
  const emailCheckEndpoint = `/contact/email/${encodeURIComponent(emailAddress)}`
  const emailCheckResponse = await getAlertingData(emailCheckEndpoint)
  const existingContactId = emailCheckResponse?.payload?.contact?.contactId
  if (existingContactId && existingContactId !== Number(contactId)) {
    throw new Error(`The email address ${emailAddress} is already registered`)
  }
}

module.exports = {
  isEmailTaken
}
