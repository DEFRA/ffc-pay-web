const mockGetContainerClient = jest.fn()
jest.mock('../../../app/storage/container-manager', () => ({ getContainerClient: mockGetContainerClient }))
jest.mock('../../../app/config', () => ({ storageConfig: { statementsContainer: 'statements-container' } }))
jest.mock('../../../app/constants/schemes', () => ({ statementAbbreviations: { 1: 'SFI', 2: 'WUR' } }))

const MODULE_PATH = '../../../app/statement-downloader/search-helpers/get-statement-parts'

const requireModule = () => require(MODULE_PATH)

describe('get-statement-parts helpers', () => {
  afterEach(() => {
    jest.clearAllMocks()
    // Ensure fresh module state where needed
    delete require.cache[require.resolve(MODULE_PATH)]
  })

  test('isValidPdfBlob: true for .pdf, false for missing name or wrong case', () => {
    const { isValidPdfBlob } = requireModule()
    expect(isValidPdfBlob({ name: 'outbound/doc.pdf' })).toBe(true)
    // .PDF (uppercase) should be false because code uses endsWith('.pdf') (case-sensitive)
    expect(isValidPdfBlob({ name: 'outbound/doc.PDF' })).toBe(false)
    expect(isValidPdfBlob({})).toBe(false)
    expect(isValidPdfBlob(null)).toBe(false)
    expect(isValidPdfBlob({ name: '' })).toBe(false)
  })

  test('parseFilename: parses expected parts and trims .pdf', () => {
    const { parseFilename } = requireModule()
    const input = 'outbound/FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000.pdf'
    expect(parseFilename(input)).toEqual({
      scheme: 'SFI',
      year: '2024',
      frn: '100',
      timestamp: '20240101120000'
    })
  })

  test('parseFilename: returns null when too few parts or missing input', () => {
    const { parseFilename } = requireModule()
    expect(parseFilename('short_name.pdf')).toBeNull()
    expect(parseFilename(null)).toBeNull()
    expect(parseFilename(undefined)).toBeNull()
  })

  test('parseFilename: handles extra underscore parts and only trims timestamp .pdf', () => {
    const { parseFilename } = requireModule()
    const input = 'FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000_extra.pdf'
    const parsed = parseFilename(input)
    expect(parsed.scheme).toBe('SFI')
    expect(parsed.year).toBe('2024')
    expect(parsed.frn).toBe('100')
    // timestamp will include the extra suffix (implementation detail) but .pdf is removed
    expect(parsed.timestamp).toBe('20240101120000')
  })

  describe('matchesCriteria', () => {
    const parsed = { scheme: 'SFI', year: '2024', frn: '100', timestamp: '20240101120000' }

    test('matches when no criteria present', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, {})).toBe(true)
    })

    test('schemeId mismatch returns false', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, { schemeId: 2 })).toBe(false)
      expect(matchesCriteria(parsed, { schemeId: 1 })).toBe(true)
    })

    test('marketingYear mismatch or match', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, { marketingYear: 2024 })).toBe(true)
      expect(matchesCriteria(parsed, { marketingYear: 2025 })).toBe(false)
    })

    test('frn mismatch or match', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, { frn: 100 })).toBe(true)
      expect(matchesCriteria(parsed, { frn: 999 })).toBe(false)
    })

    test('timestamp mismatch or match', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, { timestamp: '20240101120000' })).toBe(true)
      expect(matchesCriteria(parsed, { timestamp: '20240101120001' })).toBe(false)
    })

    test('falsy numeric criteria (0) are not checked', () => {
      const { matchesCriteria } = requireModule()
      expect(matchesCriteria(parsed, { schemeId: 0, marketingYear: 0, frn: 0 })).toBe(true)
    })
  })

  describe('buildBlobPrefix', () => {
    test('returns outbound when no scheme or scheme invalid', () => {
      const { buildBlobPrefix } = requireModule()
      expect(buildBlobPrefix({})).toBe('outbound')
      expect(buildBlobPrefix({ schemeId: 999 })).toBe('outbound')
    })

    test('builds prefix with scheme and optional parts in order', () => {
      const { buildBlobPrefix } = requireModule()
      expect(buildBlobPrefix({ schemeId: 1 })).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
      expect(buildBlobPrefix({ schemeId: 1, marketingYear: 2024 })).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024')
      expect(buildBlobPrefix({ schemeId: 1, marketingYear: 2024, frn: 100 })).toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024_100')
      expect(buildBlobPrefix({ schemeId: 1, marketingYear: 2024, frn: 100, timestamp: '20240101120000' }))
        .toBe('outbound/FFC_PaymentDelinkedStatement_SFI_2024_100_20240101120000')
    })

    test('falsy numeric marketingYear (0) is not appended', () => {
      const { buildBlobPrefix } = requireModule()
      expect(buildBlobPrefix({ schemeId: 1, marketingYear: 0 })).toBe('outbound/FFC_PaymentDelinkedStatement_SFI')
    })
  })

  describe('getStatementsContainer', () => {
    beforeEach(() => {
      mockGetContainerClient.mockReset()
      // Clear cache before each test in this suite
      delete require.cache[require.resolve(MODULE_PATH)]
    })

    test('calls getContainerClient and caches value', async () => {
      mockGetContainerClient.mockResolvedValueOnce({ client: 'x' })
      const { getStatementsContainer } = requireModule()
      const first = await getStatementsContainer()
      expect(mockGetContainerClient).toHaveBeenCalledWith('statements-container')
      expect(first).toEqual({ client: 'x' })

      // second call should return cached value and not call getContainerClient again
      const second = await getStatementsContainer()
      expect(mockGetContainerClient).toHaveBeenCalledTimes(1)
      expect(second).toBe(first)
    })

    test('propagates errors from getContainerClient', async () => {
      mockGetContainerClient.mockRejectedValueOnce(new Error('nope'))
      const { getStatementsContainer, _resetCache } = requireModule()
      _resetCache() // Clear the cache from previous test
      await expect(getStatementsContainer()).rejects.toThrow('nope')
    })
  })
})
