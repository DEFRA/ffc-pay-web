const fs = require('node:fs')
const { postRetention } = require('../api')
const { processClosureData } = require('../closure')
const { handleBulkClosureError } = require('./handle-bulk-closure-error')
const { BULK, MANAGE } = require('../constants/closures-routes')

const defaultBulkUploadError = 'An error occurred whilst processing the bulk upload.'

const readAndCheckFile = (path, request, h) => {
  let data

  try {
    data = fs.readFileSync(path, 'utf8')
  } catch (err) {
    console.error('Error reading file:', err)
    return handleBulkClosureError(
      h,
      'An error occurred whilst reading the file.',
      request.payload?.crumb ?? request.state.crumb
    )
  }

  if (!data) {
    return handleBulkClosureError(
      h,
      'File is empty or could not be read.',
      request.payload?.crumb ?? request.state.crumb
    )
  }

  return data
}

const parsePayload = (payload) => {
  if (!payload) {
    return null
  }

  if (Buffer.isBuffer(payload)) {
    return JSON.parse(payload.toString('utf8'))
  }

  if (typeof payload === 'string') {
    return JSON.parse(payload)
  }

  if (typeof payload === 'object') {
    return payload
  }

  return null
}

const getRetentionErrorMessage = (err) => {
  try {
    const parsedPayload = parsePayload(err?.data?.payload)

    if (parsedPayload?.message) {
      return parsedPayload.message
    }

    if (parsedPayload?.error) {
      return parsedPayload.error
    }
  } catch {
    // Ignore parse errors and continue to fallbacks
  }

  return err?.data?.message ??
    err?.output?.payload?.message ??
    defaultBulkUploadError
}

const handleBulkClosure = async (request, h) => {
  const file = request.payload.file
  const crumb = request.payload?.crumb ?? request.state.crumb

  if (!file || typeof file.path !== 'string') {
    return handleBulkClosureError(
      h,
      'Invalid file structure or missing file path.',
      crumb
    )
  }

  const dataOrErrorResponse = readAndCheckFile(file.path, request, h)

  if (typeof dataOrErrorResponse !== 'string') {
    return dataOrErrorResponse
  }

  const { uploadData, errors } = await processClosureData(dataOrErrorResponse)

  if (errors) {
    return handleBulkClosureError(h, errors, crumb)
  }

  const user = request.auth?.credentials.account
  const addedBy = user?.name || user?.username || user?.email

  try {
    await postRetention(BULK, { data: uploadData, addedBy }, null)

    return h.redirect(`${MANAGE}?closureAdded=bulk`)
  } catch (err) {
    return handleBulkClosureError(
      h,
      getRetentionErrorMessage(err),
      crumb
    )
  }
}

module.exports = {
  handleBulkClosure,
  getRetentionErrorMessage
}
