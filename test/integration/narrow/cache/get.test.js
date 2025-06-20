const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const { get, set } = require('../../../../app/cache')

const value = 'Value'
let key, request, server

const expectedTTL = 10000
const expectedSegment = 'default'
const expectedCacheName = 'default'

beforeEach(async () => {
  // Override cache config for tests
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
    get: async function (k) {
      return this.data[k]
    },
    set: async function (k, v) {
      this.data[k] = v
    }
  }

  request = { server }

  key = 'Key'
  await set(request, key, value)
})

afterEach(async () => {
  jest.resetAllMocks()
})

describe('get cache', () => {
  test('should return defined', async () => {
    const result = await get(request, key)
    expect(result).toBeDefined()
  })

  test('should return the cached value', async () => {
    const result = await get(request, key)
    expect(result).toBe(value)
  })

  test('should return undefined when null cache key is given', async () => {
    const result = await get(request, null)
    expect(result).toBeUndefined()
  })

  test('should return undefined when undefined cache key is given', async () => {
    const result = await get(request, undefined)
    expect(result).toBeUndefined()
  })

  test('should return undefined when empty array cache key is given', async () => {
    const result = await get(request, [])
    expect(result).toBeUndefined()
  })

  test('should return undefined when empty object cache key is given', async () => {
    const result = await get(request, {})
    expect(result).toBeUndefined()
  })

  test('should return undefined when false cache key is given', async () => {
    const result = await get(request, false)
    expect(result).toBeUndefined()
  })

  test('should return undefined when true cache key is given', async () => {
    const result = await get(request, true)
    expect(result).toBeUndefined()
  })

  test('should return undefined when incorrect request is given', async () => {
    const result = await get({}, key)
    expect(result).toBeUndefined()
  })
})
