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
let getDocContainerClient

describe('blob-service tests', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('../../../app/config', () => ({
      storageConfig: {
        useConnectionStr: true,
        createContainers: true,
        payEventStoreBlobClient: 'fake-pay-connection',
        payEventStoreStorageAccount: 'pay-account',
        payManagedIdentityClientId: 'pay-id',
        docConnectionStr: 'fake-doc-connection',
        docStorageAccount: 'doc-account',
        docManagedIdentityClientId: 'doc-id'
      }
    }))

    config = require('../../../app/config').storageConfig
    const blobService = require('../../../app/storage/blob-service')
    getPayEventStoreContainerClient = blobService.getPayEventStoreContainerClient
    getDocContainerClient = blobService.getDocContainerClient
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
})
