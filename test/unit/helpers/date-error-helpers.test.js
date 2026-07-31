const {
  addDateErrorIfRequired,
  isValidDatePart,
  isValidDate,
  minDayMonth,
  maxDay,
  maxMonth,
  minYear,
  maxYear
} = require('../../../app/helpers/date-error-helpers')

describe('add-date-error-if-required', () => {
  describe('isValidDatePart', () => {
    test.each([
      ['value within range', 15, 1, 31, true],
      ['string number within range', '15', 1, 31, true],
      ['below minimum', 0, 1, 31, false],
      ['above maximum', 32, 1, 31, false],
      ['decimal value', 1.5, 1, 31, false],
      ['non-numeric value', 'abc', 1, 31, false]
    ])('should return %s', (_description, value, min, max, expected) => {
      expect(isValidDatePart(value, min, max)).toBe(expected)
    })
  })

  describe('isValidDate', () => {
    test.each([
      ['valid date', 31, 12, 2027, true],
      ['leap year date', 29, 2, 2024, true],
      ['invalid date', 31, 2, 2025, false],
      ['non-leap year February 29th', 29, 2, 2025, false],
      ['31st April', 31, 4, 2025, false],
      ['string values', '29', '2', '2024', true]
    ])('should handle %s', (_description, day, month, year, expected) => {
      expect(isValidDate(day, month, year)).toBe(expected)
    })
  })

  describe('addDateErrorIfRequired', () => {
    test.each([
      [
        'invalid day',
        { day: 32, month: 1, year: 2025 }
      ],
      [
        'invalid month',
        { day: 1, month: 13, year: 2025 }
      ],
      [
        'invalid year',
        { day: 1, month: 1, year: 1999 }
      ],
      [
        'valid date',
        { day: 31, month: 12, year: 2027 }
      ]
    ])('should return original error for %s', (_description, payload) => {
      const error = {
        details: []
      }

      const result = addDateErrorIfRequired(error, payload)

      expect(result).toBe(error)
      expect(result.details).toHaveLength(0)
    })

    test('should add date.invalid error when date is invalid', () => {
      const error = {
        details: []
      }

      const result = addDateErrorIfRequired(error, {
        day: 31,
        month: 2,
        year: 2025
      })

      expect(result).toBe(error)

      expect(result.details).toEqual([
        {
          message: 'Enter a valid date',
          path: ['closureDate'],
          type: 'date.invalid',
          context: {
            key: 'closureDate',
            label: 'closureDate'
          }
        }
      ])
    })

    test('should not add duplicate date.invalid error', () => {
      const error = {
        details: [
          {
            message: 'Enter a valid date',
            path: ['closureDate'],
            type: 'date.invalid',
            context: {
              key: 'closureDate',
              label: 'closureDate'
            }
          }
        ]
      }

      const result = addDateErrorIfRequired(error, {
        day: 31,
        month: 2,
        year: 2025
      })

      expect(result.details).toHaveLength(1)
    })

    test('should preserve existing errors when adding date error', () => {
      const error = {
        details: [
          {
            message: 'Enter a 10-digit FRN',
            path: ['frn'],
            type: 'number.base'
          }
        ]
      }

      const result = addDateErrorIfRequired(error, {
        day: 31,
        month: 2,
        year: 2025
      })

      expect(result.details).toEqual([
        {
          message: 'Enter a 10-digit FRN',
          path: ['frn'],
          type: 'number.base'
        },
        {
          message: 'Enter a valid date',
          path: ['closureDate'],
          type: 'date.invalid',
          context: {
            key: 'closureDate',
            label: 'closureDate'
          }
        }
      ])
    })

    test.each([
      ['minDayMonth', minDayMonth, 1],
      ['maxDay', maxDay, 31],
      ['maxMonth', maxMonth, 12],
      ['minYear', minYear, 2000],
      ['maxYear', maxYear, 2099]
    ])('should export %s', (_name, value, expected) => {
      expect(value).toBe(expected)
    })
  })
})
