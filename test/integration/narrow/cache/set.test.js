const config = require('../../../../app/config')
const createServer = require('../../../../app/server')
const { set, drop } = require('../../../../app/cache')
const getCache = require('../../../../app/cache/get-cache')
const getCacheValue = require('../../../../app/cache/get-cache-value')

let key, value, request, server

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
    set: async function (k, v) {
      if (v === undefined) {
        this.data[k] = { value: v, timestamp: Date.now(), invalid: true }
      } else {
        this.data[k] = { value: v, timestamp: Date.now() }
      }
    },
    get: async function (k) {
      const entry = this.data[k]
      if (!entry) return undefined
      if (entry.invalid) {
        throw new Error('Cache retrieval error: undefined value')
      }
      if ((Date.now() - entry.timestamp) > this.rule.expiresIn) {
        delete this.data[k]
        return null
      }
      return entry.value
    },
    drop: async function (k) {
      delete this.data[k]
    }
  }

  request = { server }

  key = 'Key'
  value = 'Value'
  await set(request, key, value)
})

afterEach(async () => {
  await drop(request, key)
  jest.useRealTimers()
  jest.resetAllMocks()
})

describe('set cache', () => {
  test('should return undefined', async () => {
    const result = await set(request, key, value)
    expect(result).toBeUndefined()
  })

  test('should populate cache with key', async () => {
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toBeDefined()
  })

  test('should populate cache with value', async () => {
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toBe(value)
  })

  test('should populate cache with empty array value', async () => {
    value = []
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toStrictEqual(value)
  })

  test('should populate cache with empty object value', async () => {
    value = {}
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toStrictEqual(value)
  })

  test('should populate cache with true value', async () => {
    value = true
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toBe(value)
  })

  test('should populate cache with false value', async () => {
    value = false
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toBe(false)
  })

  test('should not populate cache with null value', async () => {
    value = null
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toBeNull()
  })

  test('should not populate cache with undefined value and throw when trying to retrieve', async () => {
    value = undefined
    await set(request, key, value)
    const wrapper = async () => {
      await getCacheValue(getCache(request), key)
    }
    await expect(wrapper).rejects.toThrowError()
  })

  test('should have cache value expire after config.cache.ttl has passed', async () => {
    value = 'Value'
    await set(request, key, value)
    const beforeTtlTimeout = await getCacheValue(getCache(request), key)

    jest.useFakeTimers()
    jest.setSystemTime(new Date(Date.now() + expectedTTL + 1000))
    const afterTtlTimeout = await getCacheValue(getCache(request), key)

    expect(beforeTtlTimeout).toBe(value)
    expect(afterTtlTimeout).toBeNull()
  })
})
