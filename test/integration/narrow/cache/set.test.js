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
      this.data[k] = v === undefined
        ? { value: v, timestamp: Date.now(), invalid: true }
        : { value: v, timestamp: Date.now() }
    },
    get: async function (k) {
      const entry = this.data[k]

      if (!entry) {
        return undefined
      } else if (entry.invalid) {
        throw new Error('Cache retrieval error: undefined value')
      } else if ((Date.now() - entry.timestamp) > this.rule.expiresIn) {
        delete this.data[k]
        return null
      }

      return entry.value
    },
    drop: async function (k) { delete this.data[k] }
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
  test('returns undefined when setting value', async () => {
    expect(await set(request, key, value)).toBeUndefined()
  })

  test.each([
    ['string', 'Value', 'Value'],
    ['empty array', [], []],
    ['empty object', {}, {}],
    ['true', true, true],
    ['false', false, false],
    ['null', null, null]
  ])('stores %s correctly', async (_, val, expected) => {
    value = val
    await set(request, key, value)
    const result = await getCacheValue(getCache(request), key)
    expect(result).toStrictEqual(expected)
  })

  test('throws error for undefined value', async () => {
    value = undefined
    await set(request, key, value)
    await expect(getCacheValue(getCache(request), key)).rejects.toThrow()
  })

  test('expires cache value after ttl', async () => {
    value = 'Value'
    await set(request, key, value)
    const before = await getCacheValue(getCache(request), key)

    jest.useFakeTimers('modern')
    jest.setSystemTime(new Date(Date.now() + expectedTTL + 1000))

    const after = await getCacheValue(getCache(request), key)
    expect(before).toBe(value)
    expect(after).toBeNull()
  })
})
