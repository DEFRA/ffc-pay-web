const api = require('../api')

const queryTrackingApi = async (url) => {
  console.debug(`Downloading report data from ${url}`)

  const response = await api.getTrackingData(url)

  console.debug('Tracking response received', response.payload)

  return response.payload.file
}

module.exports = queryTrackingApi
