describe('privacy notice route', () => {
  let createServer
  let server

  beforeEach(async () => {
    createServer = require('../../../../app/server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /privacy returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/privacy'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /privacy returns privacy view', async () => {
    const options = {
      method: 'GET',
      url: '/privacy'
    }

    const result = await server.inject(options)
    expect(result.request.response.variety).toBe('view')
    expect(result.request.response.source.template).toBe('privacy')
  })
})
