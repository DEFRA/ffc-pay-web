const { PassThrough } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { getContainerClient } = require('./container-manager')
const config = require('../config').storageConfig

const retentionExtractFilenameRegex = /^fcp-pds-data-retention-extract-\d{17}\.csv$/

const validateRetentionExtractFilename = (filename) => {
  if (!retentionExtractFilenameRegex.test(filename)) {
    throw new Error(`Invalid retention extract filename: ${filename}`)
  }
}

const getRetentionExtractBlob = async (filename) => {
  validateRetentionExtractFilename(filename)

  const retentionContainer = await getContainerClient(config.retentionContainer)
  return retentionContainer.getBlockBlobClient(filename)
}

const getRetentionExtractDownloadStreamAndDeleteAfter = async (filename) => {
  const blob = await getRetentionExtractBlob(filename)
  const downloadResponse = await blob.download(0)

  if (!downloadResponse.readableStreamBody) {
    throw new Error(`No readable stream returned for retention extract: ${filename}`)
  }

  const responseStream = new PassThrough()

  pipeline(downloadResponse.readableStreamBody, responseStream)
    .then(async () => {
      await blob.deleteIfExists()
    })
    .catch(async (err) => {
      console.log(`An error occurred streaming retention extract ${filename}: ${err.message}`)

      try {
        await blob.deleteIfExists()
      } catch (deleteErr) {
        console.log(`An error occurred deleting retention extract ${filename}: ${deleteErr.message}`)
      }

      responseStream.destroy(err)
    })

  return {
    filename,
    stream: responseStream
  }
}

module.exports = {
  getRetentionExtractDownloadStreamAndDeleteAfter
}
