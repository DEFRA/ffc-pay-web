const mockBlobContent = { test: 'test' }
const mockBlob = {
  download: jest.fn().mockResolvedValue(mockBlobContent),
  downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify(mockBlobContent))),
  delete: jest.fn().mockResolvedValue(),
  getProperties: jest.fn().mockResolvedValue({ contentLength: 123 }) // Mock getProperties
}
const mockGetContainerClient = jest.fn()
const mockContainer = {
  createIfNotExists: jest.fn(),
  getBlockBlobClient: jest.fn().mockReturnValue(mockBlob)
}
const mockBlobServiceClient = {
  getContainerClient: mockGetContainerClient.mockReturnValue(mockContainer)
}
jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient)
    }
  }
})
jest.mock('@azure/identity')
const storage = require('../../app/storage')

describe('storage', () => {
  test('getMIReport returns report data', async () => {
    const result = await storage.getMIReport('filepath')
    expect(result).toStrictEqual(mockBlobContent)
  })

  test('getSuppressedReport returns report data', async () => {
    const result = await storage.getSuppressedReport('filepath')
    expect(result).toStrictEqual(mockBlobContent)
  })

  test('getDataRequestFile returns file data and deletes the blob', async () => {
    const filename = 'testfile.json'
    const result = await storage.getDataRequestFile(filename)
    expect(result).toStrictEqual(mockBlobContent)
    expect(mockBlob.download).toHaveBeenCalled()
    expect(mockBlob.delete).toHaveBeenCalled()
  })

  test('getDataRequestFile throws error and logs warning when file is empty', async () => {
    const filename = 'emptyfile.json'
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockBlob.getProperties.mockResolvedValue({ contentLength: 5 }) // Simulate empty file

    await expect(storage.getDataRequestFile(filename)).rejects.toThrow(
      'No data was found for the selected report criteria. Please review your filters, such as date range or report type, and try again.'
    )
    expect(mockConsoleWarn).toHaveBeenCalledWith(`File ${filename} is empty.`)
    expect(mockBlob.delete).toHaveBeenCalled()
    mockConsoleWarn.mockRestore()
  })
})

describe('BlobServiceClient initialization', () => {
  let consoleLogSpy
  let config
  let BlobServiceClient
  let DefaultAzureCredential

  beforeAll(() => {
    jest.doMock('@azure/storage-blob', () => {
      const getContainerClientMock = jest.fn()
      const fromConnectionStringMock = jest.fn().mockReturnValue({
        getContainerClient: getContainerClientMock
      })
      const BlobServiceClientMock = jest.fn().mockImplementation(() => ({
        getContainerClient: getContainerClientMock
      }))
      BlobServiceClientMock.fromConnectionString = fromConnectionStringMock
      return { BlobServiceClient: BlobServiceClientMock }
    })

    jest.doMock('@azure/identity', () => ({
      DefaultAzureCredential: jest.fn().mockImplementation((options) => ({
        type: 'DefaultAzureCredential',
        options
      }))
    }))
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    config = require('../../app/config/storage')
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    ({ BlobServiceClient } = require('@azure/storage-blob'));
    ({ DefaultAzureCredential } = require('@azure/identity'))
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    jest.clearAllMocks()
  })

  test('should use connection string when config.useConnectionStr is true', () => {
    config.useConnectionStr = true
    config.connectionStr = 'fake-connection-string'

    require('../../app/storage')

    expect(consoleLogSpy).toHaveBeenCalledWith('Using connection string for BlobServiceClient')
    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
  })

  test('should use DefaultAzureCredential when config.useConnectionStr is false', () => {
    config.useConnectionStr = false
    config.storageAccount = 'fakeaccount'
    config.managedIdentityClientId = 'fake-managed-id'

    require('../../app/storage')

    const expectedUri = `https://${config.storageAccount}.blob.core.windows.net`

    expect(consoleLogSpy).toHaveBeenCalledWith('Using DefaultAzureCredential for BlobServiceClient')
    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: config.managedIdentityClientId })
    expect(BlobServiceClient).toHaveBeenCalledWith(expectedUri,
      expect.objectContaining({
        type: 'DefaultAzureCredential',
        options: { managedIdentityClientId: config.managedIdentityClientId }
      })
    )
  })

  test('getDataRequestFile calls blob.delete even if blob.download throws an error', async () => {
    const filename = 'errorfile.json'
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockBlob.getProperties.mockResolvedValue({ contentLength: 123 })
    mockBlob.download.mockRejectedValue(new Error('Download failed'))

    await expect(storage.getDataRequestFile(filename)).rejects.toThrow('Download failed')

    expect(mockBlob.delete).toHaveBeenCalled()

    mockConsoleError.mockRestore()
  })
})
