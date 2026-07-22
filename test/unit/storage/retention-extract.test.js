const { Readable } = require('node:stream')

jest.mock('node:stream/promises', () => ({
  pipeline: jest.fn()
}))

jest.mock('../../../app/config', () => ({
  storageConfig: {
    retentionContainer: 'retention-container'
  }
}))

jest.mock('../../../app/storage/container-manager', () => ({
  getContainerClient: jest.fn()
}))

const { pipeline } = require('node:stream/promises')
const { getContainerClient } = require('../../../app/storage/container-manager')
const {
  getRetentionExtractDownloadStreamAndDeleteAfter
} = require('../../../app/storage/retention-extract')

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('getRetentionExtractDownloadStreamAndDeleteAfter', () => {
  const validFilename = 'fcp-pds-data-retention-extract-20260722101112123.csv'

  let mockBlob
  let mockContainer
  let readableStreamBody

  beforeEach(() => {
    jest.clearAllMocks()

    readableStreamBody = Readable.from(['csv,data'])

    mockBlob = {
      download: jest.fn().mockResolvedValue({
        readableStreamBody
      }),
      deleteIfExists: jest.fn().mockResolvedValue(true)
    }

    mockContainer = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlob)
    }

    getContainerClient.mockResolvedValue(mockContainer)
    pipeline.mockResolvedValue()
  })

  test('returns download stream for valid filename', async () => {
    const result = await getRetentionExtractDownloadStreamAndDeleteAfter(
      validFilename
    )

    expect(getContainerClient).toHaveBeenCalledWith('retention-container')

    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(
      validFilename
    )

    expect(mockBlob.download).toHaveBeenCalledWith(0)

    expect(pipeline).toHaveBeenCalledWith(
      readableStreamBody,
      result.stream
    )

    expect(result).toEqual({
      filename: validFilename,
      stream: expect.any(Object)
    })
  })

  test('throws for invalid filename', async () => {
    await expect(
      getRetentionExtractDownloadStreamAndDeleteAfter('malicious-file.csv')
    ).rejects.toThrow(
      'Invalid retention extract filename: malicious-file.csv'
    )

    expect(getContainerClient).not.toHaveBeenCalled()
    expect(mockContainer.getBlockBlobClient).not.toHaveBeenCalled()
    expect(mockBlob.download).not.toHaveBeenCalled()
    expect(pipeline).not.toHaveBeenCalled()
  })

  test('throws if download returns no readable stream', async () => {
    mockBlob.download.mockResolvedValue({
      readableStreamBody: null
    })

    await expect(
      getRetentionExtractDownloadStreamAndDeleteAfter(validFilename)
    ).rejects.toThrow(
      `No readable stream returned for retention extract: ${validFilename}`
    )

    expect(getContainerClient).toHaveBeenCalledWith('retention-container')

    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(
      validFilename
    )

    expect(mockBlob.download).toHaveBeenCalledWith(0)
    expect(pipeline).not.toHaveBeenCalled()
    expect(mockBlob.deleteIfExists).not.toHaveBeenCalled()
  })

  test('deletes blob after successful streaming', async () => {
    pipeline.mockResolvedValue()

    await getRetentionExtractDownloadStreamAndDeleteAfter(validFilename)

    await flushPromises()

    expect(mockBlob.deleteIfExists).toHaveBeenCalledTimes(1)
  })

  test('deletes blob when source stream errors', async () => {
    pipeline.mockRejectedValue(new Error('stream failure'))

    const result = await getRetentionExtractDownloadStreamAndDeleteAfter(
      validFilename
    )

    result.stream.on('error', () => { })

    await flushPromises()

    expect(mockBlob.deleteIfExists).toHaveBeenCalledTimes(1)
  })

  test('continues when delete fails after stream error', async () => {
    const consoleSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => { })

    pipeline.mockRejectedValue(new Error('stream failure'))

    mockBlob.deleteIfExists.mockRejectedValue(
      new Error('delete failed')
    )

    const result = await getRetentionExtractDownloadStreamAndDeleteAfter(
      validFilename
    )

    result.stream.on('error', () => { })

    await flushPromises()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `An error occurred streaming retention extract ${validFilename}: stream failure`
      )
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `An error occurred deleting retention extract ${validFilename}: delete failed`
      )
    )

    consoleSpy.mockRestore()
  })

  test('requests blob download from offset 0', async () => {
    await getRetentionExtractDownloadStreamAndDeleteAfter(validFilename)

    expect(mockBlob.download).toHaveBeenCalledWith(0)
  })

  test('propagates container client errors', async () => {
    getContainerClient.mockRejectedValue(
      new Error('container failed')
    )

    await expect(
      getRetentionExtractDownloadStreamAndDeleteAfter(validFilename)
    ).rejects.toThrow('container failed')

    expect(mockContainer.getBlockBlobClient).not.toHaveBeenCalled()
    expect(mockBlob.download).not.toHaveBeenCalled()
    expect(pipeline).not.toHaveBeenCalled()
  })

  test('propagates blob download errors', async () => {
    mockBlob.download.mockRejectedValue(
      new Error('download failed')
    )

    await expect(
      getRetentionExtractDownloadStreamAndDeleteAfter(validFilename)
    ).rejects.toThrow('download failed')

    expect(getContainerClient).toHaveBeenCalledWith('retention-container')

    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(
      validFilename
    )

    expect(mockBlob.download).toHaveBeenCalledWith(0)
    expect(pipeline).not.toHaveBeenCalled()
  })
})
