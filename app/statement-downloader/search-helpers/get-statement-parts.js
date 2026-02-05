const config = require('../../config')
const { getContainerClient } = require('../../storage/container-manager')
const { statementAbbreviations } = require('../../constants/schemes')
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

const isValidPdfBlob = (blob) => !!blob?.name && blob.name.endsWith('.pdf')

const parseFilename = (blobName) => {
  const baseFilename = blobName?.split('/').pop()
  const filenameParts = baseFilename?.split('_') || []
  if (filenameParts.length < filenamePartLength) {
    return null
  }
  return {
    scheme: filenameParts[FILENAME_PARTS.SCHEME],
    year: filenameParts[FILENAME_PARTS.YEAR],
    frn: filenameParts[FILENAME_PARTS.FRN],
    timestamp: filenameParts[FILENAME_PARTS.TIMESTAMP].replace('.pdf', '')
  }
}

const matchesScheme = (schemeAbbreviation, schemeId) => statementAbbreviations[schemeId] === schemeAbbreviation

const matchesCriteria = (parsed, criteria) => {
  const { schemeId, marketingYear, frn, timestamp } = criteria
  if (schemeId && !matchesScheme(parsed.scheme, schemeId)) {
    return false
  }
  if (marketingYear && parsed.year !== marketingYear.toString()) {
    return false
  }
  if (frn && parsed.frn !== frn.toString()) {
    return false
  }
  if (timestamp && parsed.timestamp !== timestamp) {
    return false
  }
  return true
}

const buildBlobPrefix = (criteria) => {
  if (!criteria?.schemeId) {
    return 'outbound'
  }

  const schemeAbbrev = statementAbbreviations[criteria.schemeId]
  if (!schemeAbbrev) {
    return 'outbound'
  }

  let prefix = `outbound/FFC_PaymentDelinkedStatement_${schemeAbbrev}`

  if (criteria.marketingYear) {
    prefix += `_${criteria.marketingYear}`
  }

  if (criteria.frn) {
    prefix += `_${criteria.frn}`
  }

  if (criteria.timestamp) {
    prefix += `_${criteria.timestamp}`
  }

  return prefix
}

module.exports = {
  getStatementsContainer,
  _resetCache,
  isValidPdfBlob,
  parseFilename,
  matchesCriteria,
  buildBlobPrefix
}
