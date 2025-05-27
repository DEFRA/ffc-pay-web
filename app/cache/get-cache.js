const getCache = (request) => {
  return request.server.app.cache
}

module.exports = getCache
