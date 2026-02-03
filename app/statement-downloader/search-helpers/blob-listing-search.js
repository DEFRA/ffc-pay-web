const { getStatementsContainer, isValidPdfBlob, parseFilename, matchesCriteria, buildBlobPrefix } = require('./get-statement-parts')
const { createStatementResult } = require('./create-statement')

const validateAndParseBlob = (blob, criteria) => {
  if (!isValidPdfBlob(blob)) {
    return null
  }
  const parsed = parseFilename(blob.name)
  if (!parsed) {
    return null
  }
  return matchesCriteria(parsed, criteria) ? parsed : null
}

const processBlobsPage = (blobs, criteria, matchingStatements, pageLimit) => {
  for (const blob of blobs) {
    const parsed = validateAndParseBlob(blob, criteria)
    if (parsed) {
      matchingStatements.push(createStatementResult(blob, parsed))
    }
    if (matchingStatements.length >= pageLimit) {
      return true
    }
  }
  return false
}

const executeBlobSearch = async (pageLimit, continuationToken, criteria) => {
  const statementsContainer = await getStatementsContainer()
  const listingPrefix = buildBlobPrefix(criteria)
  const pages = statementsContainer.listBlobsFlat({ prefix: listingPrefix }).byPage({
    maxPageSize: pageLimit,
    continuationToken: continuationToken || undefined
  })
  const matchingStatements = []
  let nextContinuationToken = null

  for await (const page of pages) {
    const blobs = page.segment?.blobItems ?? page.blobItems ?? []
    const pageLimitReached = processBlobsPage(blobs, criteria, matchingStatements, pageLimit)
    nextContinuationToken = page.continuationToken ?? null
    if (pageLimitReached || !nextContinuationToken) {
      return { statements: matchingStatements, continuationToken: nextContinuationToken }
    }
  }

  return { statements: matchingStatements, continuationToken: nextContinuationToken }
}

const blobListingSearch = async (pageLimit, continuationToken = null, criteria = {}, timeoutMs = 25000) => {
  const searchPromise = executeBlobSearch(pageLimit, continuationToken, criteria)

  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      const err = new Error('Blob listing search timed out')
      err.code = 'BLOB_TIMEOUT'
      reject(err)
    }, timeoutMs)
  })

  return Promise.race([searchPromise, timeoutPromise])
}

module.exports = { blobListingSearch }
