jest.mock('../../../app/cache/get-cache')
const getCache = require('../../../app/cache/get-cache')

jest.mock('../../../app/cache/get-cache-value')
const getCacheValue = require('../../../app/cache/get-cache-value')

const { get } = require('../../../app/cache')

const key = 'Key'

let request

beforeEach(async () => {
  request = { server: { app: { cache: { key: 1 } } } }

  getCache.mockReturnValue(request.server.app.cache)
  getCacheValue.mockResolvedValue(request.server.app.cache.key)
})

afterEach(async () => {
  jest.resetAllMocks()
})

describe('get cache', () => {
  test('should call getCache', async () => {
    await get(request, key)
    expect(getCache).toHaveBeenCalled()
  })

  test('should call getCache once', async () => {
    await get(request, key)
    expect(getCache).toHaveBeenCalledTimes(1)
  })

  test('should call getCache with request', async () => {
    await get(request, key)
    expect(getCache).toHaveBeenCalledWith(request)
  })

  test('should call getCacheValue', async () => {
    await get(request, key)
    expect(getCacheValue).toHaveBeenCalled()
  })

  test('should call getCacheValue once', async () => {
    await get(request, key)
    expect(getCacheValue).toHaveBeenCalledTimes(1)
  })

  test('should call getCacheValue with getCache and key', async () => {
    await get(request, key)
    expect(getCacheValue).toHaveBeenCalledWith(getCache(), key)
  })

  test('should return getCacheValue', async () => {
    const result = await get(request, key)
    expect(result).toStrictEqual((await getCacheValue()))
  })

  test('should return null when getCacheValue returns null', async () => {
    getCacheValue.mockResolvedValue(null)
    const result = await get(request, key)
    expect(result).toBeNull()
  })

  test('should return undefined when getCache throws', async () => {
    getCache.mockImplementation(() => { throw new Error('Redis retreival error') })
    const result = await get(request, key)
    await expect(result).toBeUndefined()
  })

  test('should return undefined when getCacheValue throws', async () => {
    getCacheValue.mockRejectedValue(new Error('Redis retreival error'))
    const result = await get(request, key)
    await expect(result).toBeUndefined()
  })
})
