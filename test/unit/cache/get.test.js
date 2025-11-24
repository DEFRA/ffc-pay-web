jest.mock('../../../app/cache/get-cache')
jest.mock('../../../app/cache/get-cache-value')

const getCache = require('../../../app/cache/get-cache')
const getCacheValue = require('../../../app/cache/get-cache-value')
const { get } = require('../../../app/cache')

let request
const key = 'Key'

beforeEach(() => {
  request = { server: { app: { cache: { key: 1 } } } }
  getCache.mockReturnValue(request.server.app.cache)
  getCacheValue.mockResolvedValue(request.server.app.cache.key)
})

afterEach(() => jest.resetAllMocks())

describe('get cache', () => {
  test('returns cache value', async () => {
    const result = await get(request, key)
    expect(result).toBe(request.server.app.cache.key)
  })

  test('returns null if getCacheValue returns null', async () => {
    getCacheValue.mockResolvedValue(null)
    const result = await get(request, key)
    expect(result).toBeNull()
  })

  test('returns undefined if getCache throws', async () => {
    getCache.mockImplementation(() => { throw new Error('Redis error') })
    const result = await get(request, key)
    expect(result).toBeUndefined()
  })

  test('returns undefined if getCacheValue throws', async () => {
    getCacheValue.mockRejectedValue(new Error('Redis error'))
    const result = await get(request, key)
    expect(result).toBeUndefined()
  })

  test('calls getCache and getCacheValue correctly', async () => {
    await get(request, key)
    expect(getCache).toHaveBeenCalledWith(request)
    expect(getCache).toHaveBeenCalledTimes(1)
    expect(getCacheValue).toHaveBeenCalledWith(request.server.app.cache, key)
    expect(getCacheValue).toHaveBeenCalledTimes(1)
  })
})
