const { convertDateToDDMMYYYY } = require('../../../app/helpers/convert-date-to-ddmmyyyy')

describe('convertDateToDDMMYYYY', () => {
  test.each([
    ['2023-11-28', '28/11/2023'],
    ['2023-11-28T13:02:45', '28/11/2023']
  ])('should convert %s to %s', (input, expected) => {
    expect(convertDateToDDMMYYYY(input)).toBe(expected)
  })

  test.each([
    'invalid-date',
    '',
    null,
    undefined
  ])('should return null for invalid input: %s', (input) => {
    expect(convertDateToDDMMYYYY(input)).toBeNull()
  })
})
