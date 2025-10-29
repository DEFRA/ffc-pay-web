const config = require('../config')
const { getAlertingData, getProcessingData } = require('../api')
const { sanitizeSchemes } = require('../helpers')

const getContactsByScheme = async () => {
  const users = await getAlertingData('/contact-list')
  const usersPayload = users?.payload?.contacts ?? []
  for (const user of usersPayload) {
    user.canBeEdited = !config.devTeamEmails.includes(user.emailAddress) && !config.pdsTeamEmails.includes(user.emailAddress)
  }

  const schemes = await getProcessingData('/payment-schemes')
  const schemesPayload = schemes?.payload?.paymentSchemes ?? []
  const sanitizedSchemesPayload = sanitizeSchemes(schemesPayload)

  const alertTypes = await getAlertingData('/alert-types')
  const alertTypesPayload = alertTypes?.payload?.alertTypes ?? []

  for (const scheme of sanitizedSchemesPayload) {
    scheme.alertTypes = []
    for (const alertType of alertTypesPayload) {
      const matchingUsers = usersPayload.filter(user =>
        Array.isArray(user[alertType]) && user[alertType].includes(scheme.name)
      )

      scheme.alertTypes.push({
        alertType,
        users: matchingUsers
      })
    }
  }
  console.log(sanitizedSchemesPayload)
  return sanitizedSchemesPayload
}

module.exports = {
  getContactsByScheme
}
