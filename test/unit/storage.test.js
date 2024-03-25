const mockBlobContent = { test: 'test' }
const mockBlob = {
  download: jest.fn().mockResolvedValue(mockBlobContent),
  downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify(mockBlobContent)))
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

  test('getTransactionSummary returns report data', async () => {
    const result = await storage.getTransactionSummary('filepath')
    expect(result).toStrictEqual(mockBlobContent)
  })
})
