const config = require('../config').storageConfig
const { getPayEventStoreContainerClient, getPayInjectionContainerClient, getDocContainerClient } = require('./blob-service')

const clientGetters = {
  doc: getDocContainerClient,
  'pay-event-store': getPayEventStoreContainerClient,
  'pay-injection': getPayInjectionContainerClient
}

const containers = {
  [config.manualPaymentsContainer]: { name: config.manualPaymentsContainer, source: 'pay-injection', client: null, initialised: false },
  [config.reportContainer]: { name: config.reportContainer, source: 'pay-event-store', client: null, initialised: false },
  [config.dataRequestContainer]: { name: config.dataRequestContainer, source: 'pay-event-store', client: null, initialised: false },
  [config.statementsContainer]: { name: config.statementsContainer, source: 'doc', client: null, initialised: false }
}

const getClient = async (container) => {
  const getter = clientGetters[container.source]
  if (!getter) {
    throw new Error(`No client getter found for source type "${container.source}"`)
  }
  return getter(container.name)
}

const initialiseContainer = async (key) => {
  const container = containers[key]
  if (!container) {
    throw new Error(`Unknown container key: ${key}`)
  }

  console.log(`Initialising container: '${container.name}' from source: '${container.source}'`)

  if (!container.initialised) {
    container.client = await getClient(container)
    container.initialised = true
  }
  console.log(`Container '${container.name}' initialised successfully`)

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
