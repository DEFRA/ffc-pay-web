const { getStatementSchemes } = require('../../../app/helpers/get-statement-schemes')
const { getSchemes } = require('../../../app/helpers/get-schemes')

jest.mock('../../../app/helpers/get-schemes')
jest.mock('../../../app/constants/schemes', () => ({
  statementAbbreviations: {
    1: 'SFI',
    2: 'BPS',
    4: 'DP'
  }
}))

describe('get-statement-schemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStatementSchemes', () => {
    test('should return schemes that have statement abbreviations', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI' },
        { schemeId: 2, name: 'BPS' },
        { schemeId: 3, name: 'CS' },
        { schemeId: 4, name: 'DP' }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        { schemeId: 1, name: 'SFI' },
        { schemeId: 2, name: 'BPS' },
        { schemeId: 4, name: 'DP' }
      ])
    })

    test('should filter out schemes without statement abbreviations', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI' },
        { schemeId: 3, name: 'CS' },
        { schemeId: 5, name: 'Other' }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ schemeId: 1, name: 'SFI' })
    })

    test('should rename SFI22 to SFI', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI22' }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ schemeId: 1, name: 'SFI' })
    })

    test('should not rename other scheme names', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 2, name: 'BPS' },
        { schemeId: 4, name: 'DP' }
      ])

      const result = await getStatementSchemes()

      expect(result).toEqual([
        { schemeId: 2, name: 'BPS' },
        { schemeId: 4, name: 'DP' }
      ])
    })

    test('should preserve additional scheme properties', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI', description: 'Sustainable Farming Incentive', active: true }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        schemeId: 1,
        name: 'SFI',
        description: 'Sustainable Farming Incentive',
        active: true
      })
    })

    test('should return empty array when no schemes exist', async () => {
      getSchemes.mockResolvedValue([])

      const result = await getStatementSchemes()

      expect(result).toEqual([])
    })

    test('should return empty array when no matching schemes found', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 99, name: 'Unknown' },
        { schemeId: 100, name: 'Other' }
      ])

      const result = await getStatementSchemes()

      expect(result).toEqual([])
    })

    test('should handle schemes with same id as statement abbreviations', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI' },
        { schemeId: 2, name: 'BPS' }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(2)
      expect(result.map(s => s.schemeId)).toEqual([1, 2])
    })

    test('should call getSchemes once', async () => {
      getSchemes.mockResolvedValue([])

      await getStatementSchemes()

      expect(getSchemes).toHaveBeenCalledTimes(1)
    })

    test('should handle SFI22 rename with additional properties', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI22', code: 'SFI22', active: true }
      ])

      const result = await getStatementSchemes()

      expect(result[0]).toEqual({
        schemeId: 1,
        name: 'SFI',
        code: 'SFI22',
        active: true
      })
    })

    test('should maintain order of schemes from getSchemes', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 4, name: 'DP' },
        { schemeId: 1, name: 'SFI' },
        { schemeId: 2, name: 'BPS' }
      ])

      const result = await getStatementSchemes()

      expect(result.map(s => s.schemeId)).toEqual([4, 1, 2])
    })

    test('should handle numeric schemeId conversion correctly', async () => {
      getSchemes.mockResolvedValue([
        { schemeId: 1, name: 'SFI' },
        { schemeId: '2', name: 'BPS' }
      ])

      const result = await getStatementSchemes()

      expect(result).toHaveLength(1)
    })

    describe('error handling', () => {
      test('should propagate error from getSchemes', async () => {
        const error = new Error('Failed to fetch schemes')
        getSchemes.mockRejectedValue(error)

        await expect(getStatementSchemes()).rejects.toThrow('Failed to fetch schemes')
      })

      test('should handle getSchemes returning null', async () => {
        getSchemes.mockResolvedValue(null)

        await expect(getStatementSchemes()).rejects.toThrow()
      })

      test('should handle getSchemes returning undefined', async () => {
        getSchemes.mockResolvedValue(undefined)

        await expect(getStatementSchemes()).rejects.toThrow()
      })
    })

    describe('edge cases', () => {
      test('should handle scheme with schemeId 0', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 0, name: 'Test' }
        ])

        const result = await getStatementSchemes()

        expect(result).toEqual([])
      })

      test('should handle negative schemeId', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: -1, name: 'Invalid' }
        ])

        const result = await getStatementSchemes()

        expect(result).toEqual([])
      })

      test('should handle scheme with null name', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 1, name: null }
        ])

        const result = await getStatementSchemes()

        expect(result).toHaveLength(1)
        expect(result[0].name).toBeNull()
      })

      test('should handle scheme with undefined name', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 1, name: undefined }
        ])

        const result = await getStatementSchemes()

        expect(result).toHaveLength(1)
        expect(result[0].name).toBeUndefined()
      })

      test('should handle scheme with empty string name', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 1, name: '' }
        ])

        const result = await getStatementSchemes()

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('')
      })

      test('should only rename exact match of SFI22', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 1, name: 'SFI22' },
          { schemeId: 2, name: 'SFI22_NEW' },
          { schemeId: 4, name: 'sfi22' }
        ])

        const result = await getStatementSchemes()

        expect(result[0].name).toBe('SFI')
        expect(result[1].name).toBe('SFI22_NEW')
        expect(result[2].name).toBe('sfi22')
      })

      test('should handle schemes with duplicate schemeIds', async () => {
        getSchemes.mockResolvedValue([
          { schemeId: 1, name: 'SFI' },
          { schemeId: 1, name: 'SFI22' }
        ])

        const result = await getStatementSchemes()

        expect(result).toHaveLength(2)
      })

      test('should handle large number of schemes', async () => {
        const schemes = Array.from({ length: 100 }, (_, i) => ({
          schemeId: i,
          name: `Scheme${i}`
        }))
        getSchemes.mockResolvedValue(schemes)

        const result = await getStatementSchemes()

        expect(result).toHaveLength(3)
        expect(result.map(s => s.schemeId)).toEqual([1, 2, 4])
      })
    })
  })
})
