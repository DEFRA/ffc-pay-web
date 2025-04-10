const HTTP_OK = 200

module.exports = {
  method: 'GET',
  path: '/healthz',
  options: {
    auth: false
  },
  handler: (_request, h) => {
    return h.response('ok').code(HTTP_OK)
  }
}
