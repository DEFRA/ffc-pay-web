const { MANUAL_UPLOAD_AUDIT } = require('../constants/injection-routes')
const { formatDateTimeFromString } = require('../helpers/date-time-formatter')
const { getHistoricalInjectionData } = require('../api')

const manualPaymentUploadHistory = async () => {
  try {
    const { payload = [] } = await getHistoricalInjectionData(MANUAL_UPLOAD_AUDIT, 60)
    console.log(`Retrieved ${payload.length} uploads`)

    return payload.map(upload => ({
      ...upload,
      timeStamp: formatDateTimeFromString(upload.timeStamp)
    }))
  } catch (err) {
    console.error('Failed to fetch upload history:', err)
    return []
  }
}

module.exports = { manualPaymentUploadHistory }
