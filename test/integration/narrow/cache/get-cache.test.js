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
  test('returns cache object', async () => {
    expect(await getCache(request)).toBeDefined()
  })

  test('returns request.server.app.cache', async () => {
    expect(await getCache(request)).toStrictEqual(request.server.app.cache)
  })

  test.each([
    ['rule.expiresIn', cache => cache.rule.expiresIn, expectedTTL],
    ['ttl()', cache => cache.ttl(), expectedTTL],
    ['_segment', cache => cache._segment, expectedSegment]
  ])('returns %s correctly', async (_, accessor, expected) => {
    const cache = await getCache(request)
    expect(accessor(cache)).toBe(expected)
  })
})
