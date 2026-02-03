const { parseFilename } = require('./get-statement-parts')

const createStatementResult = (blob, parsed) => ({
  filename: blob.name.split('/').pop(),
  scheme: parsed.scheme,
  year: parsed.year,
  frn: parsed.frn,
  timestamp: parsed.timestamp,
  size: blob.properties?.contentLength ?? null,
  lastModified: blob.properties?.lastModified ?? null
})

const createStatementResultFromDBRow = (row) => {
  if (!row?.filename) {
    return null
  }
  const parsed = parseFilename(row.filename) || {
    scheme: row.schemeshortname,
    year: row.schemeyear?.toString(),
    frn: row.frn?.toString(),
    timestamp: null
  }
  return {
    filename: row.filename,
    scheme: parsed.scheme,
    year: parsed.year,
    frn: parsed.frn,
    timestamp: parsed.timestamp,
    size: null,
    lastModified: row.received || null,
    statementId: row.statementid
  }
}

module.exports = {
  createStatementResult,
  createStatementResultFromDBRow
}
