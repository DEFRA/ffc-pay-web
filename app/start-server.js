const createServer = require('./server')

const startServer = async () => {
  const server = createServer().then(server => server.start())

  return server
}

module.exports = startServer
