const { groupHoldCategoriesByScheme } = require('../../../app/helpers/group-hold-categories-by-scheme')

describe('groupHoldCategoriesByScheme', () => {
  test('returns empty array for empty input', () => {
    expect(groupHoldCategoriesByScheme([])).toEqual([])
  })

  test('groups categories by scheme and sorts by numeric schemeId', () => {
    const input = [
      { holdCategoryId: 1, name: 'A', schemeId: '10', schemeName: 'Scheme 10' },
      { holdCategoryId: 2, name: 'B', schemeId: '2', schemeName: 'Scheme 2' },
      { holdCategoryId: 3, name: 'C', schemeId: '10', schemeName: 'Scheme 10' }
    ]
    const result = groupHoldCategoriesByScheme(input)
    expect(result).toHaveLength(2)
    expect(result[0].schemeId).toBe('2')
    expect(result[0].schemeName).toBe('Scheme 2')
    expect(result[0].holdCategories).toEqual([{ holdCategoryId: 2, holdCategoryName: 'B' }])
    expect(result[1].schemeId).toBe('10')
    expect(result[1].schemeName).toBe('Scheme 10')
    expect(result[1].holdCategories).toEqual(expect.arrayContaining([
      { holdCategoryId: 1, holdCategoryName: 'A' },
      { holdCategoryId: 3, holdCategoryName: 'C' }
    ]))
  })

  test('maintains input order for categories within a scheme', () => {
    const input = [
      { holdCategoryId: 'a', name: 'First', schemeId: '1', schemeName: 'S1' },
      { holdCategoryId: 'b', name: 'Second', schemeId: '1', schemeName: 'S1' }
    ]
    const result = groupHoldCategoriesByScheme(input)
    expect(result).toHaveLength(1)
    expect(result[0].holdCategories.map(h => h.holdCategoryId)).toEqual(['a', 'b'])
  })
})
