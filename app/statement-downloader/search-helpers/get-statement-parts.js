const config = require('../../config')
const { getContainerClient } = require('../../storage/container-manager')
const YEAR_START = 0
const YEAR_END = 4
const MONTH_START = 4
const MONTH_END = 6
const DAY_START = 6
const DAY_END = 8
const HOUR_START = 8
const HOUR_END = 10
const MINUTE_START = 10
const MINUTE_END = 12
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
  const timestampYear = timestamp16.substring(YEAR_START, YEAR_END)
  const timestampMonth = timestamp16.substring(MONTH_START, MONTH_END)
  const timestampDay = timestamp16.substring(DAY_START, DAY_END)
  const timestampHour = timestamp16.substring(HOUR_START, HOUR_END)
  const timestampMinute = timestamp16.substring(MINUTE_START, MINUTE_END)
  const readableDate = `${timestampDay}-${timestampMonth}-${timestampYear} ${timestampHour}:${timestampMinute}`

  return {
    scheme: filenameParts[FILENAME_PARTS.SCHEME],
    year: filenameParts[FILENAME_PARTS.YEAR],
    frn: filenameParts[FILENAME_PARTS.FRN],
    timestamp16,
    timestamp: readableDate
  }
}

module.exports = {
  getStatementsContainer,
  _resetCache,
  parseFilename
}
