const mockGetContainerClient = jest.fn()
jest.mock('../../../app/storage/container-manager', () => ({ getContainerClient: mockGetContainerClient }))
jest.mock('../../../app/config', () => ({ storageConfig: { statementsContainer: 'statements-container' } }))

const MODULE_PATH = '../../../app/statement-downloader/search-helpers/get-statement-parts'

describe('get-statement-parts helpers', () => {
  afterEach(() => {
    jest.clearAllMocks()
    // Reset module cache to ensure fresh state for each test
    delete require.cache[require.resolve(MODULE_PATH)]
  })

  describe('parseFilename', () => {
    test('parses expected parts and trims .pdf from timestamp', () => {
      const { parseFilename } = require(MODULE_PATH)
      const input = 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000.pdf'
      expect(parseFilename(input)).toEqual({
        scheme: 'SFI',
        year: '2024',
        frn: '100',
        timestamp: '20240101120000'
      })
    })

    test('returns null when filename has too few parts', () => {
      const { parseFilename } = require(MODULE_PATH)
      expect(parseFilename('short_name.pdf')).toBeNull()
      expect(parseFilename('FFC_SFI_2024.pdf')).toBeNull()
    })

    test('returns null for null, undefined, or empty input', () => {
      const { parseFilename } = require(MODULE_PATH)
      expect(parseFilename(null)).toBeNull()
      expect(parseFilename(undefined)).toBeNull()
      expect(parseFilename('')).toBeNull()
    })

    test('handles filenames with extra underscore parts (ignores extras after timestamp)', () => {
      const { parseFilename } = require(MODULE_PATH)
      const input = 'FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000_extra.pdf'
      const parsed = parseFilename(input)
      expect(parsed).toEqual({
        scheme: 'SFI',
        year: '2024',
        frn: '100',
        timestamp: '20240101120000'  // .pdf trimmed, extra ignored
      })
    })

    test('handles filenames without outbound prefix', () => {
      const { parseFilename } = require(MODULE_PATH)
      const input = 'FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000.pdf'
      expect(parseFilename(input)).toEqual({
        scheme: 'SFI',
        year: '2024',
        frn: '100',
        timestamp: '20240101120000'
      })
    })
  })

  describe('getStatementsContainer', () => {
    test('calls getContainerClient and caches the result', async () => {
      mockGetContainerClient.mockResolvedValue({ client: 'mocked-client' })
      const { getStatementsContainer } = require(MODULE_PATH)

      const firstResult = await getStatementsContainer()
      expect(mockGetContainerClient).toHaveBeenCalledWith('statements-container')
      expect(firstResult).toEqual({ client: 'mocked-client' })

      // Second call should return cached value without calling getContainerClient again
      const secondResult = await getStatementsContainer()
      expect(mockGetContainerClient).toHaveBeenCalledTimes(1)
      expect(secondResult).toBe(firstResult)
    })

    test('propagates errors from getContainerClient', async () => {
      const { getStatementsContainer, _resetCache } = require(MODULE_PATH)
      _resetCache()  // Explicitly clear cache to ensure no cached value
      mockGetContainerClient.mockRejectedValue(new Error('Container client error'))

      await expect(getStatementsContainer()).rejects.toThrow('Container client error')
    })
  })

  describe('_resetCache', () => {
    test('clears the cached container so next call fetches fresh', async () => {
      const { getStatementsContainer, _resetCache } = require(MODULE_PATH)
      _resetCache()  // Explicitly clear cache to ensure no cached value
      mockGetContainerClient.mockResolvedValue({ client: 'first-client' })

      const firstResult = await getStatementsContainer()
      expect(firstResult).toEqual({ client: 'first-client' })

      // Reset cache
      _resetCache()

      // Mock a different result for the next call
      mockGetContainerClient.mockResolvedValue({ client: 'second-client' })
      const secondResult = await getStatementsContainer()
      expect(mockGetContainerClient).toHaveBeenCalledTimes(2)  // Called again after reset
      expect(secondResult).toEqual({ client: 'second-client' })
      expect(secondResult).not.toBe(firstResult)
    })
  })
})
