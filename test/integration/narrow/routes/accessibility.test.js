describe('accessibility route', () => {
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

  test('GET /accessibility returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/accessibility'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /accessibility returns accessibility view', async () => {
    const options = {
      method: 'GET',
      url: '/accessibility'
    }

    const result = await server.inject(options)
    expect(result.request.response.variety).toBe('view')
    expect(result.request.response.source.template).toBe('accessibility')
  })
})
