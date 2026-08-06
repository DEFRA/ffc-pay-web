const createServer = require('./server')

const startServer = async () => {
  const server = createServer().then(srv => srv.start())

  return server
}

module.exports = startServer
