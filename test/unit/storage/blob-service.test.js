const mockCreateIfNotExists = jest.fn()
const mockGetContainerClient = jest.fn(() => ({
  createIfNotExists: mockCreateIfNotExists
}))
const mockFromConnectionString = jest.fn(() => ({
  getContainerClient: mockGetContainerClient
}))

jest.mock('@azure/storage-blob', () => {
  const actual = jest.requireActual('@azure/storage-blob')

  const instance = {
    getContainerClient: mockGetContainerClient
  }

  return {
    ...actual,
    BlobServiceClient: Object.assign(
      jest.fn(() => instance),
      {
        fromConnectionString: mockFromConnectionString
      }
    )
  }
})

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn(() => 'mocked-default-credential')
}))

let config
let getPayEventStoreContainerClient
let getPayInjectionContainerClient
let getDocContainerClient
let getRetentionContainerClient

describe('blob-service tests', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('../../../app/config', () => ({
      storageConfig: {
        useConnectionStr: true,
        createContainers: true,
        payEventStoreConnectionStr: 'fake-pay-connection',
        payInjectionConnectionStr: 'fake-pay-injection-connection',
        pdsConnectionStr: 'fake-pds-connection',
        payStorageAccount: 'pay-account',
        docStorageAccount: 'doc-account',
        managedIdentityClientId: 'test-managed-identity'
      }
    }))

    config = require('../../../app/config').storageConfig
    const blobService = require('../../../app/storage/blob-service')
    getPayEventStoreContainerClient = blobService.getPayEventStoreContainerClient
    getPayInjectionContainerClient = blobService.getPayInjectionContainerClient
    getDocContainerClient = blobService.getDocContainerClient
    getRetentionContainerClient = blobService.getRetentionContainerClient
  })

  test('getPayEventStoreContainerClient creates container when createContainers is true', async () => {
    mockCreateIfNotExists.mockResolvedValue({ succeeded: true })

    const client = await getPayEventStoreContainerClient('pay-container')

    expect(mockFromConnectionString).toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('pay-container')
    expect(mockCreateIfNotExists).toHaveBeenCalled()
    expect(client).toBeDefined()
  })

  test('getDocContainerClient creates container when createContainers is true', async () => {
    mockCreateIfNotExists.mockResolvedValue({ succeeded: false })

    const client = await getDocContainerClient('doc-container')

    expect(mockFromConnectionString).toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('doc-container')
    expect(mockCreateIfNotExists).toHaveBeenCalled()
    expect(client).toBeDefined()
  })

  test('getPayEventStoreContainerClient skips createIfNotExists when createContainers is false', async () => {
    config.createContainers = false

    const client = await getPayEventStoreContainerClient('pay-container')

    expect(mockCreateIfNotExists).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('pay-container')
    expect(client).toBeDefined()
  })

  test('getDocContainerClient skips createIfNotExists when createContainers is false', async () => {
    config.createContainers = false

    const client = await getDocContainerClient('doc-container')

    expect(mockCreateIfNotExists).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('doc-container')
    expect(client).toBeDefined()
  })

  test('uses DefaultAzureCredential when useConnectionStr is false', async () => {
    config.useConnectionStr = false

    jest.resetModules()

    jest.doMock('../../../app/config', () => ({
      storageConfig: config
    }))

    const { BlobServiceClient } = require('@azure/storage-blob')
    BlobServiceClient.fromConnectionString.mockClear()

    const { getPayEventStoreContainerClient } = require('../../../app/storage/blob-service')

    const client = await getPayEventStoreContainerClient('pay-container')

    expect(BlobServiceClient.fromConnectionString).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('pay-container')
    expect(client).toBeDefined()
  })

  test('getPayInjectionContainerClient creates container when createContainers is true', async () => {
    mockCreateIfNotExists.mockResolvedValue({ succeeded: true })

    const client = await getPayInjectionContainerClient('injection-container')

    expect(mockGetContainerClient).toHaveBeenCalledWith('injection-container')
    expect(mockCreateIfNotExists).toHaveBeenCalled()
    expect(client).toBeDefined()
  })

  test('getPayInjectionContainerClient skips createIfNotExists when createContainers is false', async () => {
    config.createContainers = false

    const client = await getPayInjectionContainerClient('injection-container')

    expect(mockCreateIfNotExists).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('injection-container')
    expect(client).toBeDefined()
  })

  test('getRetentionContainerClient creates container when createContainers is true', async () => {
    mockCreateIfNotExists.mockResolvedValue({ succeeded: true })

    const client = await getRetentionContainerClient('retention-container')

    expect(mockGetContainerClient).toHaveBeenCalledWith('retention-container')
    expect(mockCreateIfNotExists).toHaveBeenCalled()
    expect(client).toBeDefined()
  })

  test('getRetentionContainerClient skips createIfNotExists when createContainers is false', async () => {
    config.createContainers = false

    const client = await getRetentionContainerClient('retention-container')

    expect(mockCreateIfNotExists).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('retention-container')
    expect(client).toBeDefined()
  })
})
