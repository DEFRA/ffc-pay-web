const fs = require('node:fs')
const { postProcessing, postRetention } = require('../api')
const { processClosureData } = require('../closure')
const { handleBulkClosureError } = require('./handle-bulk-closure-error')
const { BULK, MANAGE } = require('../constants/closures-routes')
const { SFI } = require('../constants/source-systems')

const checkFileStructure = (file, h, request) => {
  if (!file || typeof file.path !== 'string') {
    return handleBulkClosureError(h, 'Invalid file structure or missing file path.', request.payload?.crumb ?? request.state.crumb)
  }
}

const handleSFI22Closures = async (data) => {
  const sfi22Data = data.filter(item => item.source === SFI)
  if (sfi22Data.length > 0) {
    for (const item of sfi22Data) {
      delete item.sourceSystem
    }
    await postProcessing(BULK, { data: sfi22Data }, null)
  }
}

const handleBulkClosure = async (request, h) => {
  const file = request.payload.file

  // Validate file structure
  checkFileStructure(file, h, request)

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

  const user = request.auth?.credentials.account
  const addedBy = user?.name || user?.username || user?.email

  await postRetention(BULK, { data: uploadData, addedBy }, null)
  await handleSFI22Closures(uploadData)

  return h.redirect(`${MANAGE}?closureAdded=bulk`)
}

module.exports = { handleBulkClosure }
