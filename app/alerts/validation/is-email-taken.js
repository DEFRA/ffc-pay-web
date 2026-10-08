const { getAlertingData } = require('../../api')

const isEmailTaken = async (emailAddress, contactId) => {
  const normalizedEmail = emailAddress.trim().toLowerCase()
  const emailCheckEndpoint = `/contact/email/${encodeURIComponent(normalizedEmail)}`
  const emailCheckResponse = await getAlertingData(emailCheckEndpoint)
  const existingContactId = emailCheckResponse?.payload?.contact?.contactId
  const normalizedExistingContactId = Number(existingContactId)
  const normalizedContactId = Number(contactId)

  if (
    existingContactId &&
    normalizedExistingContactId !== normalizedContactId
  ) {
    throw new Error(`The email address ${emailAddress} is already registered`)
  }
}

module.exports = {
  isEmailTaken
}
