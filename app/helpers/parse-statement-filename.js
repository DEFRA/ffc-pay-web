const { statementAbbreviations } = require('../constants/schemes')

const filenamePartLength = 6

const FILENAME_PARTS = {
  PREFIX: 0,        // "FFC"
  DOCUMENT_TYPE: 1, // e.g., "PaymentDelinkedStatement", "PaymentStatement", etc.
  SCHEME: 2,        // e.g., "DP"
  YEAR: 3,          // e.g., "2024"
  FRN: 4,           // e.g., "1100021264"
  TIMESTAMP: 5      // e.g., "2025101508224868.pdf"
}

const abbreviationToScheme = Object.fromEntries(
  Object.entries(statementAbbreviations).map(([id, abbr]) => [abbr, Number(id)])
)

const parseStatementFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return null
  }

  const cleanFilename = filename.replace(/\.pdf$/i, '')
  const parts = cleanFilename.split('_')

  if (parts.length < filenamePartLength) {
    return null
  }

  if (parts[FILENAME_PARTS.PREFIX] !== 'FFC') {
    return null
  }

  const documentType = parts[FILENAME_PARTS.DOCUMENT_TYPE]
  const schemeAbbreviation = parts[FILENAME_PARTS.SCHEME]
  const year = parts[FILENAME_PARTS.YEAR]
  const frn = parts[FILENAME_PARTS.FRN]
  const timestamp = parts[FILENAME_PARTS.TIMESTAMP]

  return {
    documentType,
    schemeId: abbreviationToScheme[schemeAbbreviation] || null,
    schemeAbbreviation,
    marketingYear: Number.parseInt(year),
    frn: Number.parseInt(frn),
    timestamp,
    isValid: !!(
      documentType &&
      abbreviationToScheme[schemeAbbreviation] &&
      /^\d{4}$/.test(year) &&
      /^\d{10}$/.test(frn) &&
      /^\d{16}$/.test(timestamp)
    )
  }
}

module.exports = {
  parseStatementFilename
}
