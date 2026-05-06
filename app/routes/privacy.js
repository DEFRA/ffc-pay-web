module.exports = {
  method: 'GET',
  path: '/privacy',
  options: {
    handler: (request, h) => {
      return h.view('privacy')
    }
  }
}
