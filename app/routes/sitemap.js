const sitemap = require('../constants/sitemap')
const ViewModel = require('./models/sitemap')

module.exports = {
  method: 'GET',
  path: '/sitemap',
  options: {
    handler: (_request, h) => {
      return h.view('sitemap', new ViewModel(sitemap))
    }
  }
}
