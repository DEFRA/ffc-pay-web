const { set } = require('../cache')

const setLoadingStatus = async (request, jobId, { status, errors }) => {
  const data = {
    status,
    ...(errors !== undefined && { errors })
  }
  return set(request, jobId, data)
}

module.exports = { setLoadingStatus }
