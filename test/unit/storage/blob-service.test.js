jest.mock('../../../app/config', () => ({
  storageConfig: {
    reportContainer: 'report-container',
    dataRequestContainer: 'data-request-container',
    statementsContainer: 'statements-container'
  }
}))

jest.mock('../../../app/storage/blob-service', () => ({
  getPayContainerClient: jest.fn(),
  getDocsContainerClient: jest.fn()
}))

const { getPayContainerClient, getDocsContainerClient } = require('../../../app/storage/blob-service')
const { getContainerClient } = require('../../../app/storage/container-manager')

describe('getContainerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns pay container client for report-container', async () => {
    const mockClient = { name: 'report-container-client' }
    getPayContainerClient.mockResolvedValue(mockClient)

    const result = await getContainerClient('report-container')

    expect(getPayContainerClient).toHaveBeenCalledWith('report-container')
    expect(result).toBe(mockClient)
  })

  test('returns pay container client for data-request-container', async () => {
    const mockClient = { name: 'data-request-container-client' }
    getPayContainerClient.mockResolvedValue(mockClient)

    const result = await getContainerClient('data-request-container')

    expect(getPayContainerClient).toHaveBeenCalledWith('data-request-container')
    expect(result).toBe(mockClient)
  })

  test('returns docs container client for statements-container', async () => {
    const mockClient = { name: 'statements-container-client' }
    getDocsContainerClient.mockResolvedValue(mockClient)

    const result = await getContainerClient('statements-container')

    expect(getDocsContainerClient).toHaveBeenCalledWith('statements-container')
    expect(result).toBe(mockClient)
  })

  test('throws error for unknown container key', async () => {
    await expect(getContainerClient('invalid-container'))
      .rejects
      .toThrow("Container key 'invalid-container' not configured")
  })

  test('reuses already initialised container', async () => {
    jest.resetModules()
    const { getPayContainerClient } = require('../../../app/storage/blob-service')
    const { getContainerClient } = require('../../../app/storage/container-manager')

    const mockClient = { name: 'report-container-client' }
    getPayContainerClient.mockResolvedValue(mockClient)

    const firstCall = await getContainerClient('report-container')
    const secondCall = await getContainerClient('report-container')

    expect(getPayContainerClient).toHaveBeenCalledTimes(1)
    expect(firstCall).toBe(secondCall)
  })
})
