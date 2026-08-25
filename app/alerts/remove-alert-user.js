const { postAlerting } = require('../api')

const removeAlertUser = async (removedBy, contactId, emailAddress, h) => {
  const data = {
    removedBy,
    contactId
  }
  await postAlerting('/remove-contact', data, null)
  return h.redirect(`/alerts/manage-by-recipient?removed=${encodeURIComponent(emailAddress)}`)
}

module.exports = {
  removeAlertUser
}
