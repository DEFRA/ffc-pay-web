const { postAlerting } = require('../api')

const removeAlertUser = async (removedBy, contactId, h) => {
  const data = {
    removedBy,
    contactId
  }
  await postAlerting('/remove-contact', data, null)
  return h.redirect('/alerts')
}

module.exports = {
  removeAlertUser
}
