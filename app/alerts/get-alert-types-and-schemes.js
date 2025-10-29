const { getProcessingData, getAlertingData } = require('../api')
const { sanitizeSchemes } = require('../helpers')

const getAlertTypesAndSchemes = async () => {
  const schemes = await getProcessingData('/payment-schemes')
  const schemesPayload = schemes?.payload?.paymentSchemes ?? []
  const sanitizedSchemesPayload = sanitizeSchemes(schemesPayload)

  const alertTypes = await getAlertingData('/alert-types')
  const alertTypesPayload = alertTypes?.payload?.alertTypes ?? []

  return { sanitizedSchemesPayload, alertTypesPayload }
}

module.exports = {
  getAlertTypesAndSchemes
}
