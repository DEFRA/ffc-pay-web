const config = require('../config').storageConfig
const { getContainerClient } = require('./container-manager')
const { statementAbbreviations } = require('../constants/schemes')

const filenamePartLength = 6
const FILENAME_PARTS = {
  PREFIX: 0,        // "FFC"
  DOCUMENT_TYPE: 1, // "PaymentDelinkedStatement"
  SCHEME: 2,        // e.g., "DP"
  YEAR: 3,          // e.g., "2024"
  FRN: 4,           // e.g., "1100021264"
  TIMESTAMP: 5      // e.g., "2025081908254124.pdf"
}

const isValidPdfBlob = (blob) => {
  return blob.name.endsWith('.pdf')
}

const parseFilename = (blobName) => {
  const baseFilename = blobName.split('/').pop()
  const filenameParts = baseFilename.split('_')

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

const createStatementResult = (blob, parsed) => {
  return {
    filename: blob.name.split('/').pop(),
    scheme: parsed.scheme,
    year: parsed.year,
    frn: parsed.frn,
    timestamp: parsed.timestamp,
    size: blob.properties.contentLength,
    lastModified: blob.properties.lastModified
  }
}

/**
 * Search for statement files matching the given criteria
 * Filename format: FFC_PaymentDelinkedStatement_{Scheme}_{Year}_{FRN}_{Timestamp}.pdf
 * Example: FFC_PaymentDelinkedStatement_DP_2024_1100021264_2025101508224868.pdf
 */
const searchStatements = async (criteria = {}) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const matchingStatements = []

  for await (const blob of statementsContainer.listBlobsFlat({ prefix: 'outbound' })) {
    if (!isValidPdfBlob(blob)) {
      continue
    }

    const parsed = parseFilename(blob.name)
    if (parsed && matchesCriteria(parsed, criteria)) {
      matchingStatements.push(createStatementResult(blob, parsed))
    }
  }

  return matchingStatements
}

const downloadStatement = async (filename) => {
  const statementsContainer = await getContainerClient(config.statementsContainer)
  const blobPath = filename.includes('/') ? filename : `outbound/${filename}`
  const blob = await statementsContainer.getBlockBlobClient(blobPath)
  return blob.download()
}

const matchesScheme = (schemeAbbreviation, schemeId) => {
  return statementAbbreviations[schemeId] === schemeAbbreviation
}

module.exports = {
  searchStatements,
  downloadStatement
}
