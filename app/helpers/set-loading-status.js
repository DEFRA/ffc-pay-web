const { set } = require('../cache')

const setLoadingStatus = async (request, jobId, { status, redirectUrl, errors }) => {
  const data = {
    status,
    ...(redirectUrl !== undefined && { redirectUrl }),
    ...(errors !== undefined && { errors })
  }

  return set(request, jobId, data)
}

module.exports = { setLoadingStatus }
