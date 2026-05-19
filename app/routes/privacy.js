module.exports = {
  method: 'GET',
  path: '/privacy',
  options: {
    handler: (_request, h) => {
      return h.view('privacy')
    }
  }
}
