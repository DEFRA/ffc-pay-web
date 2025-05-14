const { addDetailsToFilename } = require('../../../app/helpers/add-details-to-filename')

describe('addDetailsToFilename', () => {
  test('throws if filename does not end with .csv', () => {
    expect(() => addDetailsToFilename('report.txt', {}))
      .toThrow('Filename must end with .csv')
  })

  test('uses startDate/endDate when both are present', () => {
    const q = { startDate: '2024-01-01', endDate: '2024-02-01' }
    expect(addDetailsToFilename('my.csv', q))
      .toBe('my_from_2024-01-01_to_2024-02-01.csv')
  })

  test('appends all numeric and string fields when no date range', () => {
    const q = {
      schemeId: 1,
      year: 2024,
      prn: 2,
      revenueOrCapital: 'Revenue',
      frn: 1234567890
    }
    expect(addDetailsToFilename('report.csv', q))
      .toBe('report_schemeId_1_year_2024_Revenue_2_frn_1234567890.csv')
  })

  test('defaults revenueOrCapital when blank or missing', () => {
    const q1 = { schemeId: 1, year: 2024, prn: 3, frn: 555 }
    expect(addDetailsToFilename('r.csv', q1))
      .toBe('r_schemeId_1_year_2024_revenueOrCapital_3_frn_555.csv')

    const q2 = { schemeId: 1, year: 2024, prn: 3, revenueOrCapital: '', frn: 2 }
    expect(addDetailsToFilename('r.csv', q2))
      .toBe('r_schemeId_1_year_2024_revenueOrCapital_3_frn_2.csv')
  })

  test('omits prn and/or frn when they are null', () => {
    const q = { schemeId: 42, year: 2025, revenueOrCapital: 'Cap' }
    expect(addDetailsToFilename('f.csv', q))
      .toBe('f_schemeId_42_year_2025_Cap.csv')
  })

  test('produces base name alone when no query fields given', () => {
    expect(addDetailsToFilename('empty.csv', {}))
      .toBe('empty_revenueOrCapital.csv')
  })
})
