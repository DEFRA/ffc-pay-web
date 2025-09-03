const wreck = require('@hapi/wreck')
const config = require('./config')

const getConfiguration = (token) => {
  return {
    headers: {
      Authorization: token ?? ''
    },
    json: true
  }
}

const postProcessing = async (url, data, token) => {
  const { payload } = await wreck.post(`${config.paymentsEndpoint}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return payload
}

const postInjection = async (url, data, token) => {
  const { payload } = await wreck.post(`${config.injectionEndpoint}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return payload
}

const getProcessingData = async (url, token) => {
  return wreck.get(`${config.paymentsEndpoint}${url}`, getConfiguration(token))
}

const getTrackingData = async (url, token) => {
  return wreck.get(`${config.trackingEndpoint}${url}`, getConfiguration(token))
}

module.exports = {
  postProcessing,
  postInjection,
  getProcessingData,
  getTrackingData
}
