const { getStatementsContainer } = require('./get-statement-parts')

const downloadStatement = async (filename) => {
  const statementsContainer = await getStatementsContainer()
  const blobPath = filename.includes('/') ? filename : `outbound/${filename}`
  const blobClient = statementsContainer.getBlockBlobClient(blobPath)
  await blobClient.getProperties()
  return blobClient.download()
}

module.exports = { downloadStatement }
