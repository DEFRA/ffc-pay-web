const { getMIReport, getSuppressedReport, getDataRequestFile, uploadManualPaymentFile } = require('../../../app/storage/pay-reports')
const { getContainerClient } = require('../../../app/storage/container-manager')
const config = require('../../../app/config').storageConfig

jest.mock('../../../app/storage/container-manager')
jest.mock('../../../app/config', () => ({
  storageConfig: {
    reportContainer: 'mock-report-container',
    dataRequestContainer: 'mock-data-request-container',
    miReportName: 'mock-mi-report',
    suppressedReportName: 'mock-suppressed-report',
    manualPaymentsContainer: 'mock-manual-container',
    stagingFolderName: 'staging-folder'
  }
}))

describe('uploadManualPaymentFile', () => {
  let mockBlob, mockContainer

  beforeEach(() => {
    mockBlob = {
      uploadFile: jest.fn().mockResolvedValue()
    }

    mockContainer = {
      getBlockBlobClient: jest.fn(() => mockBlob)
    }

    getContainerClient.mockResolvedValue(mockContainer)
    jest.clearAllMocks()
  })

  test('uploads file to the correct blob path', async () => {
    const filePath = '/tmp/test-file.csv'
    const fileName = 'test-file.csv'

    await uploadManualPaymentFile(filePath, fileName)

    expect(getContainerClient).toHaveBeenCalledWith(config.manualPaymentsContainer)
    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(`${config.stagingFolderName}/${fileName}`)
    expect(mockBlob.uploadFile).toHaveBeenCalledWith(filePath)
  })

  test('propagates errors from blob upload', async () => {
    mockBlob.uploadFile.mockRejectedValue(new Error('upload failed'))
    const filePath = '/tmp/test-file.csv'
    const fileName = 'test-file.csv'

    await expect(uploadManualPaymentFile(filePath, fileName)).rejects.toThrow('upload failed')
  })
})

describe('report-service', () => {
  let mockBlob, mockContainer

  beforeEach(() => {
    mockBlob = {
      download: jest.fn(),
      getProperties: jest.fn(),
      delete: jest.fn()
    }

    mockContainer = {
      getBlockBlobClient: jest.fn(() => mockBlob)
    }

    getContainerClient.mockResolvedValue(mockContainer)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getMIReport', () => {
    test('downloads MI report from storage', async () => {
      const mockDownload = { readableStreamBody: 'mock-stream' }
      mockBlob.download.mockResolvedValue(mockDownload)

      const result = await getMIReport()

      expect(getContainerClient).toHaveBeenCalledWith(config.reportContainer)
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(config.miReportName)
      expect(mockBlob.download).toHaveBeenCalled()
      expect(result).toEqual(mockDownload)
    })
  })

  describe('getSuppressedReport', () => {
    test('downloads suppressed report from storage', async () => {
      const mockDownload = { readableStreamBody: 'mock-stream' }
      mockBlob.download.mockResolvedValue(mockDownload)

      const result = await getSuppressedReport()

      expect(getContainerClient).toHaveBeenCalledWith(config.reportContainer)
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(config.suppressedReportName)
      expect(mockBlob.download).toHaveBeenCalled()
      expect(result).toEqual(mockDownload)
    })
  })

  describe('getDataRequestFile', () => {
    test('downloads data request file if not empty', async () => {
      mockBlob.getProperties.mockResolvedValue({ contentLength: 100 })
      const mockDownload = { readableStreamBody: 'mock-data-stream' }
      mockBlob.download.mockResolvedValue(mockDownload)

      const result = await getDataRequestFile('test-file.csv')

      expect(getContainerClient).toHaveBeenCalledWith(config.dataRequestContainer)
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-file.csv')
      expect(mockBlob.getProperties).toHaveBeenCalled()
      expect(mockBlob.download).toHaveBeenCalled()
      expect(mockBlob.delete).toHaveBeenCalled()
      expect(result).toEqual(mockDownload)
    })

    test('throws error and deletes file if content is empty', async () => {
      mockBlob.getProperties.mockResolvedValue({ contentLength: 5 })

      await expect(getDataRequestFile('empty-file.csv')).rejects.toThrow('No data was found for the selected report criteria')

      expect(mockBlob.getProperties).toHaveBeenCalled()
      expect(mockBlob.download).not.toHaveBeenCalled()
      expect(mockBlob.delete).toHaveBeenCalled()
    })
  })
})
