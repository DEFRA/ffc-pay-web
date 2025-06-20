const { set } = require('../cache')

const setLoadingStatus = async (request, jobId, { status, message }) => {
  const data = {
    status,
    ...(message !== undefined && { message })
  }
  return set(request, jobId, data)
}

module.exports = { setLoadingStatus }
