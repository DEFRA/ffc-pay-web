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

    describe('timestamp parameter', () => {
      test('should include timestamp when present', () => {
        const criteria = {
          timestamp: '2026011610093126'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('timestamp=2026011610093126&limit=50&offset=0')
      })

      test('should handle timestamp with all other criteria', () => {
        const criteria = {
          frn: 1234567890,
          schemeShortName: 'SFI',
          schemeYear: 2024,
          timestamp: '2026011610093126'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('frn=1234567890&schemeshortname=SFI&schemeyear=2024&timestamp=2026011610093126&limit=50&offset=0')
      })

      test('should exclude null timestamp', () => {
        const criteria = {
          frn: 1234567890,
          timestamp: null
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('frn=1234567890&limit=50&offset=0')
      })

      test('should exclude undefined timestamp', () => {
        const criteria = {
          frn: 1234567890,
          timestamp: undefined
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('frn=1234567890&limit=50&offset=0')
      })

      test('should handle timestamp as string', () => {
        const criteria = {
          timestamp: '2025081908254124'
        }
        const limit = 100
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('timestamp=2025081908254124&limit=100&offset=0')
      })

      test('should handle empty string timestamp', () => {
        const criteria = {
          frn: 1234567890,
          timestamp: ''
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('frn=1234567890&limit=50&offset=0')
      })

      test('should encode special characters in timestamp if present', () => {
        const criteria = {
          timestamp: '2026-01-16&10:09:31.26'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('timestamp=2026-01-16%2610%3A09%3A31.26&limit=50&offset=0')
      })

      test('should handle timestamp with schemeYear and frn only', () => {
        const criteria = {
          schemeYear: 2023,
          frn: 1100021264,
          timestamp: '2023091512000000'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('frn=1100021264&schemeyear=2023&timestamp=2023091512000000&limit=50&offset=0')
      })

      test('should handle timestamp with schemeShortName only', () => {
        const criteria = {
          schemeShortName: 'BPS',
          timestamp: '2024101508224868'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchParams(criteria, limit, offset)

        expect(result).toBe('schemeshortname=BPS&timestamp=2024101508224868&limit=50&offset=0')
      })
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

    describe('timestamp parameter in buildSearchQueryPath', () => {
      test('should include timestamp in query path', () => {
        const criteria = {
          timestamp: '2026011610093126'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchQueryPath(criteria, limit, offset)

        expect(result).toBe('/statements?timestamp=2026011610093126&limit=50&offset=0')
      })

      test('should build full path with timestamp and other criteria', () => {
        const criteria = {
          frn: 1234567890,
          schemeShortName: 'SFI',
          schemeYear: 2024,
          timestamp: '2026011610093126'
        }
        const limit = 50
        const offset = 0

        const result = buildSearchQueryPath(criteria, limit, offset)

        expect(result).toBe('/statements?frn=1234567890&schemeshortname=SFI&schemeyear=2024&timestamp=2026011610093126&limit=50&offset=0')
      })

      test('should handle different timestamp formats', () => {
        const criteria = {
          timestamp: '2025081908254124'
        }
        const limit = 25
        const offset = 10

        const result = buildSearchQueryPath(criteria, limit, offset)

        expect(result).toBe('/statements?timestamp=2025081908254124&limit=25&offset=10')
      })

      test('should exclude null timestamp from query path', () => {
        const criteria = {
          frn: 1234567890,
          timestamp: null
        }
        const limit = 50
        const offset = 0

        const result = buildSearchQueryPath(criteria, limit, offset)

        expect(result).toBe('/statements?frn=1234567890&limit=50&offset=0')
      })
    })
  })
})
