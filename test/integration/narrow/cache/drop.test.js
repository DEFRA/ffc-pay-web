const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const { get, drop } = require('../../../../app/cache')

const key = 'testKey'
const value = 'testValue'

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

  const dummyCache = {
    data: {},
    get: async function (k) { return this.data[k] },
    set: async function (k, v) { this.data[k] = v },
    drop: async function (k) { delete this.data[k] }
  }

  server.app.cache = dummyCache
  request = { server }
})

afterEach(async () => {
  await server.stop()
  jest.resetAllMocks()
})

describe('cache operations', () => {
  test('get returns undefined for missing key', async () => {
    expect(await get(request, 'missing')).toBeUndefined()
  })

  test('get returns stored value', async () => {
    await server.app.cache.set(key, value)
    expect(await get(request, key)).toBe(value)
  })

  test('drop removes key', async () => {
    await server.app.cache.set(key, value)
    expect(await get(request, key)).toBe(value)

    await drop(request, key)
    expect(await get(request, key)).toBeUndefined()
  })

  test('drop on non-existing key resolves and changes nothing', async () => {
    await expect(drop(request, 'absent')).resolves.toBeUndefined()
    expect(await get(request, key)).toBeUndefined()
  })
})
