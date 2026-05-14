module.exports = {
  method: 'GET',
  path: '/accessibility',
  options: {
    handler: (_request, h) => {
      return h.view('accessibility')
    }
  }
}
