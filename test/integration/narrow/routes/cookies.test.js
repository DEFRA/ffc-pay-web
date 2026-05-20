jest.mock('../../../../app/auth')
jest.mock('../../../../app/api')

const cheerio = require('cheerio')
const createServer = require('../../../../app/server')

let server
let auth

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [] } }
  server = await createServer()
})

afterEach(async () => {
  await server.stop()
})

describe('Cookies route', () => {
  test('GET /cookies returns 200 and shows page', async () => {
    const res = await server.inject({ method: 'GET', url: '/cookies', auth })
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h2').text().trim()).toContain('Cookies on Payment management')
  })

  test('GET /cookies?updated=true shows success banner', async () => {
    const res = await server.inject({ method: 'GET', url: '/cookies?updated=true', auth })
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('body').text()).toContain('set your cookie preferences')
  })

  test('POST /cookies sets cookie and redirects to updated page', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: true },
      auth
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/cookies?updated=true')
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie.some(c => c.startsWith('cookies_policy='))).toBe(true)
  })

  test('POST /cookies with async=true returns ok and sets cookie', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: false, async: true },
      auth
    })
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual('ok')
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie.some(c => c.startsWith('cookies_policy='))).toBe(true)
  })

  test('POST /cookies with invalid analytics value returns 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: 'not-a-bool' },
      auth
    })
    expect(res.statusCode).toBe(400)
  })
})
