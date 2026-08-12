const { getAlertingData } = require('../api')

const getAlertsByScheme = async (schemeId) => {
  const users = await getAlertingData(`/contact-list/by-scheme/${encodeURIComponent(schemeId)}`)
  const usersPayload = users?.payload?.contacts ?? []

  const alertTypes = await getAlertingData('/alert-types')
  const alertTypesPayload = alertTypes?.payload?.alertTypes ?? []

  const normalizedSchemeId = Number(schemeId)
  const typesWithUsers = []

  for (const type of alertTypesPayload) {
    const matchingUsers = usersPayload.filter(user =>
      Array.isArray(user[type]) && user[type].includes(normalizedSchemeId)
    )

    typesWithUsers.push({
      type,
      users: matchingUsers
    })
  }

  const formattedTypes = typesWithUsers.map((alertType) => ({
    ...alertType,
    displayType: alertType.type
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }))

  return {
    formattedTypes,
    schemeName: users?.payload?.schemeName
  }
}

module.exports = {
  getAlertsByScheme
}
