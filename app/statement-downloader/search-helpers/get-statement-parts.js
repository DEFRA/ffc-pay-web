const config = require('../../config')
const { getContainerClient } = require('../../storage/container-manager')
let _cachedStatementsContainer = null

const getStatementsContainer = async () => {
  if (_cachedStatementsContainer) {
    return _cachedStatementsContainer
  }
  _cachedStatementsContainer = await getContainerClient(config.storageConfig.statementsContainer)
  return _cachedStatementsContainer
}

const _resetCache = () => {
  _cachedStatementsContainer = null
}

const filenamePartLength = 6
const FILENAME_PARTS = {
  PREFIX: 0,
  DOCUMENT_TYPE: 1,
  SCHEME: 2,
  YEAR: 3,
  FRN: 4,
  TIMESTAMP: 5
}

const parseFilename = (blobName) => {
  const baseFilename = blobName?.split('/').pop()
  const filenameParts = baseFilename?.split('_') || []
  if (filenameParts.length < filenamePartLength) {
    return null
  }
  const timestamp16 = filenameParts[FILENAME_PARTS.TIMESTAMP].replace('.pdf', '')
  const timestampYear = timestamp16.substring(0, 4)
  const timestampMonth = timestamp16.substring(4, 6)
  const timestampDay = timestamp16.substring(6, 8)
  const timestampHour = timestamp16.substring(8, 10)
  const timestampMinute = timestamp16.substring(10, 12)
  const readableDate = `${timestampDay}-${timestampMonth}-${timestampYear} ${timestampHour}:${timestampMinute}`

  return {
    scheme: filenameParts[FILENAME_PARTS.SCHEME],
    year: filenameParts[FILENAME_PARTS.YEAR],
    frn: filenameParts[FILENAME_PARTS.FRN],
    timestamp: readableDate
  }
}

module.exports = {
  getStatementsContainer,
  _resetCache,
  parseFilename
}
