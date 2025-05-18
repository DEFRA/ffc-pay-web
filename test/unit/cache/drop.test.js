jest.mock('../../../app/cache/get-cache')
const getCache = require('../../../app/cache/get-cache')

jest.mock('../../../app/cache/drop-cache-key')
const dropCacheKey = require('../../../app/cache/drop-cache-key')

const { drop } = require('../../../app/cache')

const key = 'Key'

let request

beforeEach(async () => {
  request = { server: { app: { cache: { key: 1 } } } }

  getCache.mockReturnValue(request.server.app.cache)
  dropCacheKey.mockResolvedValue(undefined)
})

afterEach(async () => {
  jest.resetAllMocks()
})

describe('drop cache', () => {
  test('should call getCache', async () => {
    await drop(request, key)
    expect(getCache).toHaveBeenCalled()
  })

  test('should call getCache once', async () => {
    await drop(request, key)
    expect(getCache).toHaveBeenCalledTimes(1)
  })

  test('should call getCache with request', async () => {
    await drop(request, key)
    expect(getCache).toHaveBeenCalledWith(request)
  })

  test('should call dropCacheKey', async () => {
    await drop(request, key)
    expect(dropCacheKey).toHaveBeenCalled()
  })

  test('should call dropCacheKey once', async () => {
    await drop(request, key)
    expect(dropCacheKey).toHaveBeenCalledTimes(1)
  })

  test('should call dropCacheKey with getCach and key', async () => {
    await drop(request, key)
    expect(dropCacheKey).toHaveBeenCalledWith(getCache(), key)
  })

  test('should return undefined', async () => {
    const result = await drop(request, key)
    expect(result).toBeUndefined()
  })

  test('should throw when getCache throws', async () => {
    getCache.mockImplementation(() => { throw new Error('Redis retreival error') })

    const wrapper = async () => {
      await drop(request, key)
    }

    await expect(wrapper).rejects.toThrowError()
  })

  test('should throw Error when getCache throws Error', async () => {
    getCache.mockImplementation(() => { throw new Error('Redis retreival error') })

    const wrapper = async () => {
      await drop(request, key)
    }

    await expect(wrapper).rejects.toThrowError(Error)
  })

  test('should throw "Redis retreival error" error when getCache throws "Redis retreival error" error', async () => {
    getCache.mockImplementation(() => { throw new Error('Redis retreival error') })

    const wrapper = async () => {
      await drop(request, key)
    }

    expect(wrapper).rejects.toThrowError(/^Redis retreival error$/)
  })

  test('should throw when dropCacheKey throws', async () => {
    dropCacheKey.mockRejectedValue(new Error('Redis drop error'))

    const wrapper = async () => {
      await drop(request, key)
    }

    expect(wrapper).rejects.toThrowError()
  })

  test('should throw Error when dropCacheKey throws Error', async () => {
    dropCacheKey.mockRejectedValue(new Error('Redis drop error'))

    const wrapper = async () => {
      await drop(request, key)
    }

    expect(wrapper).rejects.toThrowError(Error)
  })

  test('should throw "Redis drop error" error when dropCacheKey throws "Redis drop error" error', async () => {
    dropCacheKey.mockRejectedValue(new Error('Redis drop error'))

    const wrapper = async () => {
      await drop(request, key)
    }

    expect(wrapper).rejects.toThrowError(/^Redis drop error$/)
  })
})
