const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const getCache = require('../../../../app/cache/get-cache')

let request
let server

const expectedTTL = 10000
const expectedSegment = 'default'
const expectedCacheName = 'default'

beforeEach(async () => {
  config.cache = {
    ttl: expectedTTL,
    segment: expectedSegment,
    cacheName: expectedCacheName,
    catbox: require('@hapi/catbox-memory'),
    catboxOptions: {}
  }
  server = await createServer()
  await server.initialize()

  server.app.cache = {
    rule: { expiresIn: expectedTTL },
    ttl: () => expectedTTL,
    _segment: expectedSegment
  }

  request = { server }
})

afterEach(async () => {
  jest.resetAllMocks()
})

describe('get cache object', () => {
  test('should return defined', async () => {
    const result = await getCache(request)
    expect(result).toBeDefined()
  })

  test('should return request.server.app.cache', async () => {
    const result = await getCache(request)
    expect(result).toStrictEqual(request.server.app.cache)
  })

  test('should return rule.expiresIn as expected ttl', async () => {
    const result = await getCache(request)
    expect(result.rule.expiresIn).toBe(expectedTTL)
  })

  test('should return ttl() as expected ttl', async () => {
    const result = await getCache(request)
    expect(result.ttl()).toBe(expectedTTL)
  })

  test('should return _segment as expected segment', async () => {
    const result = await getCache(request)
    expect(result._segment).toBe(expectedSegment)
  })
})
