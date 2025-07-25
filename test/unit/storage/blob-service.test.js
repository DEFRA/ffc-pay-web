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
let getPayContainerClient
let getDocContainerClient

describe('blob-service tests', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('../../../app/config', () => ({
      storageConfig: {
        useConnectionStr: true,
        createContainers: true,
        payConnectionStr: 'fake-pay-connection',
        payStorageAccount: 'pay-account',
        payManagedIdentityClientId: 'pay-id',
        docConnectionStr: 'fake-doc-connection',
        docStorageAccount: 'doc-account',
        docManagedIdentityClientId: 'doc-id'
      }
    }))

    config = require('../../../app/config').storageConfig
    const blobService = require('../../../app/storage/blob-service')
    getPayContainerClient = blobService.getPayContainerClient
    getDocContainerClient = blobService.getDocContainerClient
  })

  test('getPayContainerClient creates container when createContainers is true', async () => {
    mockCreateIfNotExists.mockResolvedValue({ succeeded: true })

    const client = await getPayContainerClient('pay-container')

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

  test('getPayContainerClient skips createIfNotExists when createContainers is false', async () => {
    config.createContainers = false

    const client = await getPayContainerClient('pay-container')

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

    const { getPayContainerClient } = require('../../../app/storage/blob-service')

    const client = await getPayContainerClient('pay-container')

    expect(BlobServiceClient.fromConnectionString).not.toHaveBeenCalled()
    expect(mockGetContainerClient).toHaveBeenCalledWith('pay-container')
    expect(client).toBeDefined()
  })
})
