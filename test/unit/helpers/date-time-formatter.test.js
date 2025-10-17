const moment = require('moment')
const {
  formatDateFromParts,
  formatDateFromString,
  formatDateTimeFromString
} = require('../../../app/helpers/date-time-formatter') // adjust path as needed

describe('Date formatting helpers', () => {
  describe('formatDateFromParts', () => {
    test('returns correctly formatted date when valid parts provided', () => {
      expect(formatDateFromParts(5, 9, 2025)).toBe('2025-09-05')
    })

    test('pads single digits with zeros', () => {
      expect(formatDateFromParts(1, 1, 2025)).toBe('2025-01-01')
    })

    test('returns null if any part is missing', () => {
      expect(formatDateFromParts(null, 1, 2025)).toBeNull()
      expect(formatDateFromParts(1, undefined, 2025)).toBeNull()
      expect(formatDateFromParts(1, 1, '')).toBeNull()
    })
  })

  describe('formatDateFromString', () => {
    test('formats a valid date string correctly', () => {
      const result = formatDateFromString('10/03/2025 14:30', 'DD/MM/YYYY HH:mm')
      expect(result).toBe('10/03/2025')
    })

    test('returns "Unknown" if dateToFormat is null', () => {
      expect(formatDateFromString(null)).toBe('Unknown')
    })

    test('returns "Unknown" if dateToFormat is undefined', () => {
      expect(formatDateFromString(undefined)).toBe('Unknown')
    })

    test('handles different formats if specified', () => {
      const result = formatDateFromString('2025-03-10', 'YYYY-MM-DD')
      expect(result).toBe('10/03/2025')
    })
  })

  describe('formatDateTimeFromString', () => {
    test('formats ISO date correctly', () => {
      const result = formatDateTimeFromString('2025-10-13T14:16:23.123Z')
      expect(result).toBe(moment('2025-10-13T14:16:23.123Z').format('DD/MM/YYYY - HH:mm'))
    })

    test('handles non-ISO date when custom format given', () => {
      const input = '13/10/2025 14:16'
      const result = formatDateTimeFromString(input, 'DD/MM/YYYY HH:mm')
      expect(result).toBe('13/10/2025 - 14:16')
    })

    test('returns "Unknown" if dateToFormat is null', () => {
      expect(formatDateTimeFromString(null)).toBe('Unknown')
    })

    test('returns "Invalid date" if input cannot be parsed', () => {
      const result = formatDateTimeFromString('not-a-date')
      expect(result).toBe('Invalid date')
    })
  })
})
