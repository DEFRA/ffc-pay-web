const { updateAlertUser } = require('./update-alert-user')
const { removeAlertUser } = require('./remove-alert-user')
const { getContactsByScheme } = require('./get-contacts-by-scheme')
const { getAlertTypesAndSchemes } = require('./get-alert-types-and-schemes')
const { getAlertUpdateViewData } = require('./get-alert-update-view-data')

module.exports = {
  updateAlertUser,
  removeAlertUser,
  getAlertTypesAndSchemes,
  getAlertUpdateViewData,
  getContactsByScheme
}
