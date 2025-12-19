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
  const { res, payload } = await wreck.post(`${config.injectionEndpoint}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return { statusCode: res.statusCode, payload }
}

const postAlerting = async (url, data, token) => {
  const { res, payload } = await wreck.post(`${config.alertingEndpoint}${url}`, {
    payload: data,
    ...getConfiguration(token)
  })
  return { statusCode: res.statusCode, payload }
}

const getProcessingData = async (url, token) => {
  return wreck.get(`${config.paymentsEndpoint}${url}`, getConfiguration(token))
}

const getTrackingData = async (url, token) => {
  return wreck.get(`${config.trackingEndpoint}${url}`, getConfiguration(token))
}

const getAlertingData = async (url, token) => {
  return wreck.get(`${config.alertingEndpoint}${url}`, getConfiguration(token))
}

const getInjectionData = async (url, token) => {
  return wreck.get(`${config.injectionEndpoint}${url}`, getConfiguration(token))
}

const getHistoricalInjectionData = async (endpoint, daysBack, token) => {
  const today = new Date()
  const fromDate = new Date()
  fromDate.setDate(today.getDate() - daysBack)

  const from = fromDate.toISOString().split('T')[0]
  const to = today.toISOString().split('T')[0]

  const endpointUrl = `${endpoint}?from=${from}&to=${to}`

  return getInjectionData(endpointUrl, token)
}

const getStatementPublisherData = async (url, token) => {
  const { payload } = await wreck.get(`${config.statementPublisherEndpoint}${url}`, getConfiguration(token))
  return payload
}

module.exports = {
  postProcessing,
  postInjection,
  postAlerting,
  getProcessingData,
  getTrackingData,
  getAlertingData,
  getInjectionData,
  getHistoricalInjectionData,
  getStatementPublisherData
}
