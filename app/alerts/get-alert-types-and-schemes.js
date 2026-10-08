const { getAlertingData } = require('../api')
const { getSchemes } = require('../helpers')

const getAlertTypesAndSchemes = async () => {
  const schemes = getSchemes()

  const alertTypes = await getAlertingData('/alert-types')
  const alertTypesPayload = alertTypes?.payload?.alertTypes ?? []

  return { schemes, alertTypesPayload }
}

module.exports = {
  getAlertTypesAndSchemes
}
