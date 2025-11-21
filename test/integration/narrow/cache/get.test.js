const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const { get, set } = require('../../../../app/cache')

const value = 'Value'
let key, request, server

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
    _segment: expectedSegment,
    data: {},
    get: async function (k) { return this.data[k] },
    set: async function (k, v) { this.data[k] = v }
  }

  request = { server }

  key = 'Key'
  await set(request, key, value)
})

afterEach(async () => {
  jest.resetAllMocks()
})

describe('get cache', () => {
  test('returns defined for cached key', async () => {
    expect(await get(request, key)).toBeDefined()
  })

  test('returns cached value', async () => {
    expect(await get(request, key)).toBe(value)
  })

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['empty array', []],
    ['empty object', {}],
    ['false', false],
    ['true', true]
  ])('returns undefined for invalid cache key: %s', async (_, invalidKey) => {
    expect(await get(request, invalidKey)).toBeUndefined()
  })

  test('returns undefined when request is invalid', async () => {
    expect(await get({}, key)).toBeUndefined()
  })
})
