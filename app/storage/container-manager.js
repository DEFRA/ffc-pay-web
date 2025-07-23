const config = require('../config').storageConfig
const { getPayContainerClient, getDocContainerClient } = require('./blob-service')

const containers = {
  [config.reportContainer]: { name: config.reportContainer, source: 'pay', client: null, initialised: false },
  [config.dataRequestContainer]: { name: config.dataRequestContainer, source: 'pay', client: null, initialised: false },
  [config.statementsContainer]: { name: config.statementsContainer, source: 'doc', client: null, initialised: false }
}

const initialiseContainer = async (key) => {
  const container = containers[key]
  if (!container) {
    throw new Error(`Unknown container key: ${key}`)
  }

  if (!container.initialised) {
    const getClient = container.source === 'doc' ? getDocContainerClient : getPayContainerClient
    container.client = await getClient(container.name)
    container.initialised = true
  }

  return container.client
}

const getContainerClient = async (key) => {
  if (!containers[key]) {
    throw new Error(`Container key '${key}' not configured`)
  }

  return initialiseContainer(key)
}

module.exports = {
  getContainerClient
}
