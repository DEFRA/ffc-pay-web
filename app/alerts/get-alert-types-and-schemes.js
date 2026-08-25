const { getProcessingData, getAlertingData } = require('../api')
const { SCHEMES_PATH } = require('../constants/common-api-urls')
const { sanitizeSchemes } = require('../helpers')

const getAlertTypesAndSchemes = async () => {
  const schemes = await getProcessingData(SCHEMES_PATH)
  const schemesPayload = schemes?.payload?.paymentSchemes ?? []
  const sanitizedSchemesPayload = sanitizeSchemes(schemesPayload)

  const alertTypes = await getAlertingData('/alert-types')
  const alertTypesPayload = alertTypes?.payload?.alertTypes ?? []

  return { sanitizedSchemesPayload, alertTypesPayload }
}

module.exports = {
  getAlertTypesAndSchemes
}
