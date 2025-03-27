const { convertDateToDDMMYYYY } = require('../../../app/helpers/convert-date-to-ddmmyyyy')

describe('convertDateToDDMMYYYY', () => {
  test('should convert a valid ISO date string to DD/MM/YYYY format', () => {
    expect(convertDateToDDMMYYYY('2023-11-28')).toBe('28/11/2023')
  })

  test('should convert a date string with time to DD/MM/YYYY format', () => {
    expect(convertDateToDDMMYYYY('2023-11-28T13:02:45')).toBe('28/11/2023')
  })

  test('should return null for an invalid date string', () => {
    expect(convertDateToDDMMYYYY('invalid-date')).toBeNull()
  })

  test('should return null for an empty string', () => {
    expect(convertDateToDDMMYYYY('')).toBeNull()
  })

  test('should return null for a null value', () => {
    expect(convertDateToDDMMYYYY(null)).toBeNull()
  })

  test('should return null for an undefined value', () => {
    expect(convertDateToDDMMYYYY(undefined)).toBeNull()
  })
})
