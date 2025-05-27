const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const { get, drop } = require('../../../../app/cache')

const key = 'testKey'
const value = 'testValue'

let request, server

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

  const dummyCache = {
    data: {},
    get: async function (k) {
      return this.data[k]
    },
    set: async function (k, v) {
      this.data[k] = v
    },
    drop: async function (k) {
      delete this.data[k]
    }
  }

  server.app.cache = dummyCache

  request = { server }
})

afterEach(async () => {
  await server.stop()
  jest.resetAllMocks()
})

describe('Cache operations', () => {
  test('get returns undefined for non-existing key', async () => {
    const result = await get(request, 'non-existent')
    expect(result).toBeUndefined()
  })

  test('get returns value for existing key', async () => {
    await server.app.cache.set(key, value)
    const result = await get(request, key)
    expect(result).toBe(value)
  })

  test('drop removes key from cache', async () => {
    await server.app.cache.set(key, value)
    const cacheValueBefore = await get(request, key)
    expect(cacheValueBefore).toBe(value)

    await drop(request, key)
    const cacheValueAfter = await get(request, key)
    expect(cacheValueAfter).toBeUndefined()
  })

  test('drop on non-existing key does nothing', async () => {
    await expect(drop(request, 'doesntExist')).resolves.toBeUndefined()
    const cacheValue = await get(request, key)
    expect(cacheValue).toBeUndefined()
  })
})
