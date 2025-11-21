const cheerio = require('cheerio')

const testPageAccess = (server, auth, method, url, pageH1 = null) => {
  describe(`${method} ${url}`, () => {
    test('returns 200 when load successful', async () => {
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      if (pageH1 != null) {
        const $ = cheerio.load(res.payload)
        expect($('h1').text()).toBe(pageH1)
      }
    })

    test('returns 403 if no permission', async () => {
      const modifiedAuth = { strategy: 'session-auth', credentials: { scope: [] } }
      const res = await server.inject({ method, url, auth: modifiedAuth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 if no auth', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })
}

module.exports = { testPageAccess }
