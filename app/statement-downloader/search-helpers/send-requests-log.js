const api = require('../../api')

const sendRequestsLog = async (entry) => {
  console.info('[Requests] Sending POST /requests with payload:', entry)
  return api.postStatementPublisher('/requests', entry, null)
}

module.exports = {
  sendRequestsLog
}
