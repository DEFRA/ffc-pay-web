const { SitemapStream, streamToPromise } = require('sitemap')
const config = require('../config')

module.exports = {
  method: 'GET',
  path: '/sitemap.xml',
  options: {
    auth: false,
    handler: async (request, h) => {
      const rawHost = process.env.SITE_HOSTNAME ?? `localhost:${config.port}`
      const hostname = /^https?:\/\//i.test(rawHost) ? rawHost : `http://${rawHost}`
      const smStream = new SitemapStream({ hostname })

      const routes = request.server.table()
        .filter(r => r.method.toUpperCase() === 'GET')
        .map(r => r.path)
        .filter(p => !p.includes('{') && !p.startsWith('/static') && p !== '/sitemap.xml')

      routes.forEach(path => smStream.write({ url: path, changefreq: 'weekly', priority: 0.7 }))
      smStream.end()
      const xml = (await streamToPromise(smStream)).toString()
      return h.response(xml).type('application/xml')
    }
  }
}
