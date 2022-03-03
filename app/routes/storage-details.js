const { getStorageDetails, getFileDetails, downloadPaymentFile } = require('../blob-storage')

module.exports = {
  method: 'GET',
  path: '/storage-details',
  options: {
    handler: async (request, h) => {
      let fileDetails = {}
      let fileContent = {}
      const filename = request.query.filename
      const prefix = request.query.prefix
      const containerName = request.query.containerName
      const storageDetails = await getStorageDetails()
      if (filename) {
        fileDetails = await getFileDetails(containerName, prefix, filename)
        fileContent = await downloadPaymentFile(containerName, prefix, filename)
      }
      return h.view('storage-details', { storageDetails, fileDetails, fileContent, containerName })
    }
  }
}
