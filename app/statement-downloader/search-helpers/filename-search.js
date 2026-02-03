const { getStatementsContainer } = require('./get-statement-parts')
const { createStatementResult, createStatementResultFromDBRow } = require('./create-statement')
const db = require('../statement-db-search')
const { NOT_FOUND } = require('../../constants/http-status-codes')
const { parseFilename } = require('./get-statement-parts')

const createBasicStatementResult = (filename, props) => ({
  statements: [{
    filename,
    size: props.contentLength ?? null,
    lastModified: props.lastModified ?? null
  }],
  continuationToken: null
})

const searchBlobByFilename = async (blobPath, filename) => {
  const statementsContainer = await getStatementsContainer()
  const blobClient = statementsContainer.getBlockBlobClient(blobPath)
  const props = await blobClient.getProperties()
  const blob = { name: blobPath, properties: props }
  const parsed = parseFilename(blob.name)

  if (parsed) {
    return { statements: [createStatementResult(blob, parsed)], continuationToken: null }
  }

  return createBasicStatementResult(filename, props)
}

const searchDbByFilename = async (filename) => {
  try {
    const row = await db.getByFilename(filename)
    const rowResult = createStatementResultFromDBRow(row)
    return rowResult ? { statements: [rowResult], continuationToken: null } : { statements: [], continuationToken: null }
  } catch (error) {
    console.warn('DB filename search failed:', error?.message || error)
    return { statements: [], continuationToken: null }
  }
}

const isBlobNotFoundError = (err) => {
  const status = err?.statusCode ?? err?.status ?? null
  return status === NOT_FOUND || err?.code === 'BlobNotFound'
}

const filenameSearch = async (criteria) => {
  if (!criteria?.filename) {
    return null
  }

  const filename = criteria.filename
  const blobPath = filename.includes('/') ? filename : `outbound/${filename}`

  try {
    return await searchBlobByFilename(blobPath, filename)
  } catch (err) {
    if (isBlobNotFoundError(err)) {
      return searchDbByFilename(filename)
    }
    throw err
  }
}

module.exports = { filenameSearch }
