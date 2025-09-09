const fs = require('fs')
const { postProcessing } = require('../api')
const { processClosureData } = require('../closure')
const { handleBulkClosureError } = require('./handle-bulk-closure-error')
const { BULK, BASE } = require('../constants/closures-routes')

const handleBulkClosure = async (request, h) => {
  const file = request.payload.file

  // Validate file structure
  if (!file || typeof file.path !== 'string') {
    return handleBulkClosureError(h, 'Invalid file structure or missing file path.', request.payload?.crumb ?? request.state.crumb)
  }

  let data
  try {
    data = fs.readFileSync(file.path, 'utf8')
  } catch (err) {
    console.error('Error reading file:', err)
    return handleBulkClosureError(h, 'An error occurred whilst reading the file.', request.payload?.crumb ?? request.state.crumb)
  }

  if (!data) {
    return handleBulkClosureError(h, 'File is empty or could not be read.', request.payload?.crumb ?? request.state.crumb)
  }

  const { uploadData, errors } = await processClosureData(data)
  if (errors) {
    return handleBulkClosureError(h, errors, request.payload?.crumb ?? request.state.crumb)
  }

  await postProcessing(BULK, { data: uploadData }, null)
  return h.redirect(BASE)
}

module.exports = { handleBulkClosure }
