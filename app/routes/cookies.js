module.exports = {
  method: 'GET',
  path: '/cookies',
  options: {
    handler: (request, h) => {
      return h.view('cookies')
    }
  }
}
