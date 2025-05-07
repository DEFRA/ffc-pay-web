require('log-timestamp')
require('./insights').setup()

const createServer = require('./server')

const startApp = async () => {
  createServer()
    .then(server => server.start())
    .catch(err => {
      console.log(err)
      process.exit(1)
    })
}

(async () => {
  await startApp()
})()

module.exports = startApp
