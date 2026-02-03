const { downloadStatement } = require('../../../app/statement-downloader/search-helpers/download-statement')
const { getStatementsContainer } = require('../../../app/statement-downloader/search-helpers/get-statement-parts')

jest.mock('../../../app/statement-downloader/search-helpers/get-statement-parts')

describe('download-statement', () => {
  let mockBlobClient
  let mockStatementsContainer

  beforeEach(() => {
    jest.clearAllMocks()

    mockBlobClient = {
      getProperties: jest.fn(),
      download: jest.fn()
    }

    mockStatementsContainer = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient)
    }

    getStatementsContainer.mockResolvedValue(mockStatementsContainer)
  })

  describe('basic functionality', () => {
    test('should download statement by filename', async () => {
      const mockDownloadResponse = { readableStreamBody: 'stream' }
      mockBlobClient.download.mockResolvedValue(mockDownloadResponse)

      const result = await downloadStatement('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')

      expect(result).toEqual(mockDownloadResponse)
    })

    test('should call getStatementsContainer', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(getStatementsContainer).toHaveBeenCalled()
    })

    test('should get blob client with correct path', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/statement.pdf')
    })

    test('should call getProperties before download', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(mockBlobClient.getProperties).toHaveBeenCalled()
    })

    test('should call download after getProperties', async () => {
      const callOrder = []
      mockBlobClient.getProperties.mockImplementation(() => {
        callOrder.push('getProperties')
      })
      mockBlobClient.download.mockImplementation(() => {
        callOrder.push('download')
        return { readableStreamBody: 'stream' }
      })

      await downloadStatement('statement.pdf')

      expect(callOrder).toEqual(['getProperties', 'download'])
    })
  })

  describe('filename path handling', () => {
    test('should add outbound prefix when filename has no slash', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'
      )
    })

    test('should not add outbound prefix when filename already has slash', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'
      )
    })

    test('should handle filename with multiple slashes', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('outbound/2024/09/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/2024/09/FFC_Statement_SFI_2024_1100021264_20240915120000.pdf'
      )
    })

    test('should handle filename with single slash at start', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('/statement.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        '/statement.pdf'
      )
    })

    test('should handle empty string filename', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/')
    })

    test('should handle filename with only extension', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/.pdf')
    })
  })

  describe('download response', () => {
    test('should return download response object', async () => {
      const mockResponse = {
        readableStreamBody: 'mock-stream-body',
        contentLength: 1024
      }
      mockBlobClient.download.mockResolvedValue(mockResponse)

      const result = await downloadStatement('statement.pdf')

      expect(result).toEqual(mockResponse)
    })

    test('should return response with readableStreamBody', async () => {
      const mockStream = { pipe: jest.fn() }
      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockStream
      })

      const result = await downloadStatement('statement.pdf')

      expect(result.readableStreamBody).toEqual(mockStream)
    })

    test('should return response with metadata', async () => {
      const mockResponse = {
        readableStreamBody: 'stream',
        contentLength: 2048,
        contentType: 'application/pdf',
        lastModified: new Date('2024-09-15')
      }
      mockBlobClient.download.mockResolvedValue(mockResponse)

      const result = await downloadStatement('statement.pdf')

      expect(result.contentLength).toBe(2048)
      expect(result.contentType).toBe('application/pdf')
    })
  })

  describe('error handling', () => {
    test('should propagate error from getStatementsContainer', async () => {
      const error = new Error('Container access failed')
      getStatementsContainer.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('Container access failed')
    })

    test('should propagate error from getProperties', async () => {
      const error = new Error('Blob not found')
      mockBlobClient.getProperties.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('Blob not found')
    })

    test('should propagate error from download', async () => {
      const error = new Error('Download failed')
      mockBlobClient.download.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('Download failed')
    })

    test('should handle blob not found error', async () => {
      const error = new Error('BlobNotFound')
      error.code = 'BlobNotFound'
      mockBlobClient.getProperties.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('BlobNotFound')
    })

    test('should handle access denied error', async () => {
      const error = new Error('AuthorizationFailed')
      error.code = 'AuthorizationFailed'
      mockBlobClient.download.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('AuthorizationFailed')
    })

    test('should handle timeout error', async () => {
      const error = new Error('Operation timed out')
      mockBlobClient.download.mockRejectedValue(error)

      await expect(downloadStatement('statement.pdf')).rejects.toThrow('Operation timed out')
    })
  })

  describe('blob client operations', () => {
    test('should call getBlockBlobClient with constructed path', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('test.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledTimes(1)
      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/test.pdf')
    })

    test('should get properties without arguments', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(mockBlobClient.getProperties).toHaveBeenCalledWith()
    })

    test('should download without arguments', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(mockBlobClient.download).toHaveBeenCalledWith()
    })

    test('should get properties and download on same blob client', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.pdf')

      expect(mockBlobClient.getProperties).toHaveBeenCalled()
      expect(mockBlobClient.download).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    test('should handle very long filename', async () => {
      const longFilename = 'FFC_' + 'A'.repeat(500) + '.pdf'
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement(longFilename)

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(`outbound/${longFilename}`)
    })

    test('should handle filename with special characters', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('FFC_Statement-SFI_2024_1100021264_20240915120000.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC_Statement-SFI_2024_1100021264_20240915120000.pdf'
      )
    })

    test('should handle filename with spaces', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('FFC Statement 2024.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(
        'outbound/FFC Statement 2024.pdf'
      )
    })

    test('should handle filename with uppercase extension', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('statement.PDF')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/statement.PDF')
    })

    test('should handle filename with multiple dots', async () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement('FFC.Statement.2024.pdf')

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/FFC.Statement.2024.pdf')
    })
  })

  describe('async behavior', () => {
    test('should be async function', () => {
      expect(downloadStatement.constructor.name).toBe('AsyncFunction')
    })

    test('should return promise', () => {
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      const result = downloadStatement('statement.pdf')

      expect(result instanceof Promise).toBe(true)
    })

    test('should resolve promise with download response', async () => {
      const mockResponse = { readableStreamBody: 'stream', contentLength: 1024 }
      mockBlobClient.download.mockResolvedValue(mockResponse)

      const result = await downloadStatement('statement.pdf')

      expect(result).toBe(mockResponse)
    })
  })

  describe('integration scenarios', () => {
    test('should handle standard statement filename', async () => {
      const filename = 'FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000.pdf'
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream', contentLength: 5120 })

      const result = await downloadStatement(filename)

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(`outbound/${filename}`)
      expect(result.contentLength).toBe(5120)
    })

    test('should handle pre-pathed filename', async () => {
      const filename = 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_1100021264_20240915120000.pdf'
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream', contentLength: 5120 })

      const result = await downloadStatement(filename)

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(filename)
      expect(result.contentLength).toBe(5120)
    })

    test('should handle nested path filename', async () => {
      const filename = 'outbound/archive/2024/FFC_Statement_BPS_2024_1100021264_20240915120000.pdf'
      mockBlobClient.download.mockResolvedValue({ readableStreamBody: 'stream' })

      await downloadStatement(filename)

      expect(mockStatementsContainer.getBlockBlobClient).toHaveBeenCalledWith(filename)
    })
  })
})
