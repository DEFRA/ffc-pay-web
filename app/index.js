require('log-timestamp')
require('./insights').setup()

const startServer = require('./start-server')

const startApp = async () => {
  startServer()
}

(async () => {
  await startApp()
})()

module.exports = startApp
