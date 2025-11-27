jest.mock('../../../app/cache/get-cache')
jest.mock('../../../app/cache/drop-cache-key')

const getCache = require('../../../app/cache/get-cache')
const dropCacheKey = require('../../../app/cache/drop-cache-key')
const { drop } = require('../../../app/cache')

let request
const key = 'Key'

beforeEach(() => {
  request = { server: { app: { cache: { key: 1 } } } }
  getCache.mockReturnValue(request.server.app.cache)
  dropCacheKey.mockResolvedValue(undefined)
})

afterEach(() => jest.resetAllMocks())

describe('drop cache', () => {
  test('normal execution', async () => {
    const result = await drop(request, key)
    expect(getCache).toHaveBeenCalledWith(request)
    expect(dropCacheKey).toHaveBeenCalledWith(request.server.app.cache, key)
    expect(result).toBeUndefined()
  })

  test.each([
    ['getCache throws', () => getCache.mockImplementation(() => { throw new Error('Redis retrieval error') }), /^Redis retrieval error$/],
    ['dropCacheKey rejects', () => dropCacheKey.mockRejectedValue(new Error('Redis drop error')), /^Redis drop error$/]
  ])('throws correctly when %s', async (_desc, setup, expectedError) => {
    setup()
    await expect(drop(request, key)).rejects.toThrow(expectedError)
  })
})
