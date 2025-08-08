jest.mock('../../../app/config', () => ({
  storageConfig: {
    reportContainer: 'report-container',
    dataRequestContainer: 'data-request-container',
    statementsContainer: 'statements-container'
  }
}))

jest.mock('../../../app/storage/blob-service', () => ({
  getPayEventStoreContainerClient: jest.fn(),
  getDocContainerClient: jest.fn()
}))

describe('getContainerClient', () => {
  let getPayEventStoreContainerClient
  let getDocContainerClient
  let getContainerClient

  beforeEach(() => {
    jest.resetModules()
    getPayEventStoreContainerClient = require('../../../app/storage/blob-service').getPayEventStoreContainerClient
    getDocContainerClient = require('../../../app/storage/blob-service').getDocContainerClient
    getContainerClient = require('../../../app/storage/container-manager').getContainerClient
  })

  test('returns pay client for report-container', async () => {
    const mockClient = { name: 'report-client' }
    getPayEventStoreContainerClient.mockResolvedValue(mockClient)

    const client = await getContainerClient('report-container')

    expect(getPayEventStoreContainerClient).toHaveBeenCalledWith('report-container')
    expect(client).toBe(mockClient)
  })

  test('returns pay client for data-request-container', async () => {
    const mockClient = { name: 'data-request-client' }
    getPayEventStoreContainerClient.mockResolvedValue(mockClient)

    const client = await getContainerClient('data-request-container')

    expect(getPayEventStoreContainerClient).toHaveBeenCalledWith('data-request-container')
    expect(client).toBe(mockClient)
  })

  test('returns doc client for statements-container', async () => {
    const mockClient = { name: 'statements-client' }
    getDocContainerClient.mockResolvedValue(mockClient)

    const client = await getContainerClient('statements-container')

    expect(getDocContainerClient).toHaveBeenCalledWith('statements-container')
    expect(client).toBe(mockClient)
  })

  test('throws error for unknown container key', async () => {
    await expect(getContainerClient('invalid-container')).rejects.toThrow("Container key 'invalid-container' not configured")
  })

  test('reuses already initialised container (only calls client once)', async () => {
    const mockClient = { name: 'report-client' }
    getPayEventStoreContainerClient.mockResolvedValue(mockClient)

    const first = await getContainerClient('report-container')
    const second = await getContainerClient('report-container')

    expect(getPayEventStoreContainerClient).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)
  })
})
