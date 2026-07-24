jest.mock('../../../app/config', () => ({
  storageConfig: {
    manualPaymentsContainer: 'manual-payments-container',
    reportContainer: 'report-container',
    dataRequestContainer: 'data-request-container',
    statementsContainer: 'statements-container',
    retentionContainer: 'retention-container'
  }
}))

jest.mock('../../../app/storage/blob-service', () => ({
  getPayEventStoreContainerClient: jest.fn(),
  getPayInjectionContainerClient: jest.fn(),
  getDocContainerClient: jest.fn(),
  getRetentionContainerClient: jest.fn()
}))

describe('getContainerClient', () => {
  let getPayEventStoreContainerClient
  let getPayInjectionContainerClient
  let getDocContainerClient
  let getRetentionContainerClient
  let getContainerClient

  beforeEach(() => {
    jest.resetModules()

    const blobService = require('../../../app/storage/blob-service')

    getPayEventStoreContainerClient = blobService.getPayEventStoreContainerClient
    getPayInjectionContainerClient = blobService.getPayInjectionContainerClient
    getDocContainerClient = blobService.getDocContainerClient
    getRetentionContainerClient = blobService.getRetentionContainerClient

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

  test('returns pay injection client for manual-payments-container', async () => {
    const mockClient = { name: 'manual-payments-client' }

    getPayInjectionContainerClient.mockResolvedValue(mockClient)

    const client = await getContainerClient('manual-payments-container')

    expect(getPayInjectionContainerClient)
      .toHaveBeenCalledWith('manual-payments-container')

    expect(client).toBe(mockClient)
  })

  test('returns retention client for retention-container', async () => {
    const mockClient = { name: 'retention-client' }

    getRetentionContainerClient.mockResolvedValue(mockClient)

    const client = await getContainerClient('retention-container')

    expect(getRetentionContainerClient)
      .toHaveBeenCalledWith('retention-container')

    expect(client).toBe(mockClient)
  })
})
