const { mapHoldCategoriesToRadios } = require('../../../app/hold/map-hold-categories-to-radios')
const { radioButtonMapper } = require('../../../app/helpers/radio-button-mapper')

jest.mock('../../../app/helpers/radio-button-mapper')

describe('mapHoldCategoriesToRadios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSchemes = [
    { id: 8, name: 'MANUAL' },
    { id: 15, name: 'CSHT_REVENUE' }
  ]

  const mockCategories = [
    { schemeId: 8, holdCategoryId: 'A', name: 'Cat A' },
    { schemeId: 8, holdCategoryId: 'B', name: 'Cat B' },
    { schemeId: 15, holdCategoryId: 'C', name: 'Cat C' }
  ]

  test('groups categories by schemeId and calls radioButtonMapper per scheme', () => {
    radioButtonMapper.mockImplementation((categories, options) => {
      return categories.map(c => ({
        id: `${options.schemeId}_${c.name}_id`,
        value: c.holdCategoryId,
        text: c.name
      }))
    })

    const result = mapHoldCategoriesToRadios(mockSchemes, mockCategories, { valueKey: 'holdCategoryId' })

    expect(radioButtonMapper).toHaveBeenCalledTimes(2)
    expect(radioButtonMapper).toHaveBeenCalledWith(
      [
        { schemeId: 8, holdCategoryId: 'A', name: 'Cat A' },
        { schemeId: 8, holdCategoryId: 'B', name: 'Cat B' }
      ],
      { valueKey: 'holdCategoryId', schemeId: 8 }
    )
    expect(radioButtonMapper).toHaveBeenCalledWith(
      [{ schemeId: 15, holdCategoryId: 'C', name: 'Cat C' }],
      { valueKey: 'holdCategoryId', schemeId: 15 }
    )

    expect(result).toEqual([
      {
        scheme: { id: 8, name: 'MANUAL' },
        radios: [
          { id: '8_Cat A_id', value: 'A', text: 'Cat A' },
          { id: '8_Cat B_id', value: 'B', text: 'Cat B' }
        ]
      },
      {
        scheme: { id: 15, name: 'CSHT_REVENUE' },
        radios: [
          { id: '15_Cat C_id', value: 'C', text: 'Cat C' }
        ]
      }
    ])
  })

  test('returns empty radios array for a scheme with no categories', () => {
    radioButtonMapper.mockReturnValue([])

    const result = mapHoldCategoriesToRadios(
      [{ id: 3, name: 'LUMP_SUMS' }],
      mockCategories,
      { valueKey: 'holdCategoryId' }
    )

    expect(radioButtonMapper).toHaveBeenCalledWith([], { valueKey: 'holdCategoryId', schemeId: 3 })
    expect(result).toEqual([
      {
        scheme: { id: 3, name: 'LUMP_SUMS' },
        radios: []
      }
    ])
  })

  test('handles empty input arrays gracefully', () => {
    radioButtonMapper.mockReturnValue([])

    const result = mapHoldCategoriesToRadios([], [], {})
    expect(result).toEqual([])
    expect(radioButtonMapper).not.toHaveBeenCalled()
  })
})
