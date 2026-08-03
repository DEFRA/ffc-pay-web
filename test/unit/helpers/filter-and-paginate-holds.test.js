const { filterAndPaginateHolds } = require('../../../app/helpers/filter-and-paginate-holds')

describe('filterAndPaginateHolds', () => {
  const holds = Array.from({ length: 250 }, (_, i) => ({
    frn: i < 5 ? '1111111111' : String(1000000000 + i),
    holdCategorySchemeName: i % 2 === 0 ? 'SchemeA' : 'SchemeB'
  }))

  test('defaults to page 1 and 100 per page when no options given', () => {
    const result = filterAndPaginateHolds(holds)

    expect(result.page).toBe(1)
    expect(result.perPage).toBe(100)
    expect(result.numberOfHolds).toBe(250)
    expect(result.paymentHolds).toHaveLength(100)
    expect(result.paymentHolds[0]).toEqual(holds[0])
    expect(result.paymentHolds[99]).toEqual(holds[99])
  })

  test('slices the requested page using the requested page size', () => {
    const result = filterAndPaginateHolds(holds, { page: 2, perPage: 100 })

    expect(result.paymentHolds).toHaveLength(100)
    expect(result.paymentHolds[0]).toEqual(holds[100])
    expect(result.paymentHolds[99]).toEqual(holds[199])
  })

  test('returns the remainder on the final page', () => {
    const result = filterAndPaginateHolds(holds, { page: 3, perPage: 100 })

    expect(result.paymentHolds).toHaveLength(50)
    expect(result.numberOfHolds).toBe(250)
  })

  test('filters by frn before paginating', () => {
    const result = filterAndPaginateHolds(holds, { frn: '1111111111' })

    expect(result.numberOfHolds).toBe(5)
    expect(result.paymentHolds).toHaveLength(5)
    expect(result.paymentHolds.every(h => h.frn === '1111111111')).toBe(true)
  })

  test('filters by schemeName before paginating', () => {
    const result = filterAndPaginateHolds(holds, { schemeName: 'SchemeA' })

    expect(result.numberOfHolds).toBe(125)
    expect(result.paymentHolds).toHaveLength(100)
    expect(result.paymentHolds.every(h => h.holdCategorySchemeName === 'SchemeA')).toBe(true)
  })

  test('combines frn and schemeName filters', () => {
    const result = filterAndPaginateHolds(holds, { frn: '1111111111', schemeName: 'SchemeB' })

    expect(result.numberOfHolds).toBe(2)
    expect(result.paymentHolds).toHaveLength(2)
  })
})
