const { mapHoldCategoriesToRadios } = require('../../../app/hold/map-hold-categories-to-radios')
const { radioButtonMapper } = require('../../../app/helpers/radio-button-mapper')

jest.mock('../../../app/helpers/radio-button-mapper')

describe('mapHoldCategoriesToRadios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSchemes = [
    { id: 'scheme1', name: 'Scheme 1' },
    { id: 'scheme2', name: 'Scheme 2' }
  ]

  const mockCategories = [
    { schemeId: 'scheme1', holdCategoryId: 'A', name: 'Cat A' },
    { schemeId: 'scheme1', holdCategoryId: 'B', name: 'Cat B' },
    { schemeId: 'scheme2', holdCategoryId: 'C', name: 'Cat C' }
  ]

  test('groups categories by schemeId and calls radioButtonMapper per scheme', () => {
    radioButtonMapper.mockImplementation((categories, options) => categories.map(c => c.name))

    const result = mapHoldCategoriesToRadios(mockSchemes, mockCategories, { valueKey: 'holdCategoryId' })

    expect(radioButtonMapper).toHaveBeenCalledTimes(2)
    expect(radioButtonMapper).toHaveBeenCalledWith(
      [
        { schemeId: 'scheme1', holdCategoryId: 'A', name: 'Cat A' },
        { schemeId: 'scheme1', holdCategoryId: 'B', name: 'Cat B' }
      ],
      { valueKey: 'holdCategoryId' }
    )
    expect(radioButtonMapper).toHaveBeenCalledWith(
      [{ schemeId: 'scheme2', holdCategoryId: 'C', name: 'Cat C' }],
      { valueKey: 'holdCategoryId' }
    )

    expect(result).toEqual([
      {
        scheme: { id: 'scheme1', name: 'Scheme 1' },
        radios: ['Cat A', 'Cat B']
      },
      {
        scheme: { id: 'scheme2', name: 'Scheme 2' },
        radios: ['Cat C']
      }
    ])
  })

  test('returns empty radios array for a scheme with no categories', () => {
    radioButtonMapper.mockReturnValue([])

    const result = mapHoldCategoriesToRadios(
      [{ id: 'scheme3', name: 'Empty scheme' }],
      mockCategories,
      { valueKey: 'holdCategoryId' }
    )

    expect(radioButtonMapper).toHaveBeenCalledWith([], { valueKey: 'holdCategoryId' })
    expect(result).toEqual([
      {
        scheme: { id: 'scheme3', name: 'Empty scheme' },
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
