jest.mock('../../../app/cache/get-cache')
jest.mock('../../../app/cache/set-cache-value')

const getCache = require('../../../app/cache/get-cache')
const setCacheValue = require('../../../app/cache/set-cache-value')
const { set } = require('../../../app/cache')

let request
const key = 'Key'
const value = 'Value'

beforeEach(() => {
  request = { server: { app: { cache: { key: 1 } } } }
  getCache.mockReturnValue(request.server.app.cache)
  setCacheValue.mockResolvedValue(undefined)
})

afterEach(() => jest.resetAllMocks())

describe('set cache', () => {
  test.each([
    ['calls getCache and setCacheValue normally', null, undefined],
    ['throws if getCache throws', 'getCacheThrows', /^Redis retreival error$/],
    ['throws if setCacheValue throws', 'setCacheValueThrows', /^Redis write error$/]
  ])('%s', async (_name, scenario, expectedError) => {
    if (scenario === 'getCacheThrows') {
      getCache.mockImplementation(() => { throw new Error('Redis retreival error') })
    } else if (scenario === 'setCacheValueThrows') {
      setCacheValue.mockRejectedValue(new Error('Redis write error'))
    }

    if (expectedError) {
      await expect(set(request, key, value)).rejects.toThrowError(expectedError)
    } else {
      const result = await set(request, key, value)
      expect(getCache).toHaveBeenCalledWith(request)
      expect(setCacheValue).toHaveBeenCalledWith(getCache(), key, value)
      expect(result).toBeUndefined()
    }
  })
})
