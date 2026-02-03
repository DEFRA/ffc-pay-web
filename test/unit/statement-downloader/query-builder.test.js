const { buildSearchParams, buildFilenameQueryPath, buildSearchQueryPath } = require('../../../app/statement-downloader/search-helpers/query-builder')

describe('query-builder', () => {
  describe('buildSearchParams', () => {
    test('should build params with all criteria present', () => {
      const criteria = {
        frn: 12345,
        schemeShortName: 'SFI',
        schemeYear: 2024
      }
      const limit = 50
      const offset = 0

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('frn=12345&schemeshortname=SFI&schemeyear=2024&limit=50&offset=0')
    })

    test('should exclude null/undefined criteria', () => {
      const criteria = {
        frn: null,
        schemeShortName: undefined,
        schemeYear: 2024
      }
      const limit = 10
      const offset = 20

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('schemeyear=2024&limit=10&offset=20')
    })

    test('should handle empty criteria object', () => {
      const criteria = {}
      const limit = 100
      const offset = 0

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('limit=100&offset=0')
    })

    test('should encode special characters', () => {
      const criteria = {
        frn: '123&45',
        schemeShortName: 'SFI/Test',
        schemeYear: '2024'
      }
      const limit = 50
      const offset = 0

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('frn=123%2645&schemeshortname=SFI%2FTest&schemeyear=2024&limit=50&offset=0')
    })

    test('should handle numeric values', () => {
      const criteria = {
        frn: 123,
        schemeYear: 2024
      }
      const limit = 25
      const offset = 50

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('frn=123&schemeyear=2024&limit=25&offset=50')
    })

    test('should handle zero values', () => {
      const criteria = {
        frn: 0,
        schemeYear: 0
      }
      const limit = 0
      const offset = 0

      const result = buildSearchParams(criteria, limit, offset)

      expect(result).toBe('frn=0&schemeyear=0&limit=0&offset=0')
    })
  })

  describe('buildFilenameQueryPath', () => {
    test('should build path with filename', () => {
      const filename = 'test.pdf'

      const result = buildFilenameQueryPath(filename)

      expect(result).toBe('/statements?filename=test.pdf')
    })

    test('should encode special characters in filename', () => {
      const filename = 'test file & more.pdf'

      const result = buildFilenameQueryPath(filename)

      expect(result).toBe('/statements?filename=test%20file%20%26%20more.pdf')
    })

    test('should handle empty filename', () => {
      const filename = ''

      const result = buildFilenameQueryPath(filename)

      expect(result).toBe('/statements?filename=')
    })

    test('should handle filename with path', () => {
      const filename = 'outbound/test.pdf'

      const result = buildFilenameQueryPath(filename)

      expect(result).toBe('/statements?filename=outbound%2Ftest.pdf')
    })
  })

  describe('buildSearchQueryPath', () => {
    test('should build full path with query string', () => {
      const criteria = {
        frn: 12345,
        schemeShortName: 'SFI',
        schemeYear: 2024
      }
      const limit = 50
      const offset = 0

      const result = buildSearchQueryPath(criteria, limit, offset)

      expect(result).toBe('/statements?frn=12345&schemeshortname=SFI&schemeyear=2024&limit=50&offset=0')
    })

    test('should handle partial criteria', () => {
      const criteria = {
        frn: 12345
      }
      const limit = 10
      const offset = 5

      const result = buildSearchQueryPath(criteria, limit, offset)

      expect(result).toBe('/statements?frn=12345&limit=10&offset=5')
    })

    test('should handle empty criteria', () => {
      const criteria = {}
      const limit = 100
      const offset = 0

      const result = buildSearchQueryPath(criteria, limit, offset)

      expect(result).toBe('/statements?limit=100&offset=0')
    })

    test('should encode all parameters', () => {
      const criteria = {
        frn: '123&45',
        schemeShortName: 'SFI/Test',
        schemeYear: '2024'
      }
      const limit = 50
      const offset = 0

      const result = buildSearchQueryPath(criteria, limit, offset)

      expect(result).toBe('/statements?frn=123%2645&schemeshortname=SFI%2FTest&schemeyear=2024&limit=50&offset=0')
    })
  })
})
