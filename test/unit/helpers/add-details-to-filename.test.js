const { addDetailsToFilename } = require('../../../app/helpers/add-details-to-filename')

describe('add detail to filename', () => {
  test('should throw an error if filename does not end with .csv', () => {
    expect(() => addDetailsToFilename('report.txt', 1, 2024, 'Revenue', 1234567890))
      .toThrow('An internal configuration error occurred - filename is not in expected format')
  })

  test('should correctly add schemeId, year, revenueOrCapital, and frn to the filename', () => {
    const result = addDetailsToFilename('report.csv', 1, 2024, 'Revenue', 1234567890)
    expect(result).toBe('report_schemeId_1_year_2024_revenueOrCapital_Revenue_frn_1234567890.csv')
  })

  test('should correctly add schemeId and year to the filename when revenueOrCapital and frn are not provided', () => {
    const result = addDetailsToFilename('report.csv', 1, 2024)
    expect(result).toBe('report_schemeId_1_year_2024.csv')
  })

  test('should correctly add schemeId, year, and revenueOrCapital to the filename when frn is not provided', () => {
    const result = addDetailsToFilename('report.csv', 1, 2024, 'Capital')
    expect(result).toBe('report_schemeId_1_year_2024_revenueOrCapital_Capital.csv')
  })

  test('should correctly add schemeId, year, and frn to the filename when revenueOrCapital is not provided', () => {
    const result = addDetailsToFilename('report.csv', 1, 2024, null, 9876543210)
    expect(result).toBe('report_schemeId_1_year_2024_frn_9876543210.csv')
  })

  test('should handle empty values for revenueOrCapital and frn', () => {
    const result = addDetailsToFilename('report.csv', 1, 2024, '', '')
    expect(result).toBe('report_schemeId_1_year_2024.csv')
  })
})