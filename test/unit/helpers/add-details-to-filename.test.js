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

  test.each([
    [{ schemeId: 1, year: 2024, prn: 2, revenueOrCapital: 'Revenue', frn: 1234567890 },
      'report_schemeId_1_year_2024_Revenue_2_frn_1234567890.csv'],
    [{ schemeId: 1, year: 2024, prn: 3, frn: 555 },
      'r_schemeId_1_year_2024_revenueOrCapital_3_frn_555.csv'],
    [{ schemeId: 1, year: 2024, prn: 3, revenueOrCapital: '', frn: 2 },
      'r_schemeId_1_year_2024_3_frn_2.csv'],
    [{ schemeId: 42, year: 2025, revenueOrCapital: 'Cap' },
      'f_schemeId_42_year_2025_Cap.csv'],
    [{}, 'empty_revenueOrCapital.csv']
  ])('formats filename correctly for query %p', (query, expected) => {
    const baseName = expected.split('_')[0] + '.csv'
    expect(addDetailsToFilename(baseName, query)).toBe(expected)
  })
})
