const {
  formatDateFromParts,
  formatDateFromString
} = require('../../../app/helpers/format-date')

const moment = require('moment')

describe('formatDateFromParts', () => {
  test('returns null if any of day, month or year is missing', () => {
    expect(formatDateFromParts()).toBeNull()
    expect(formatDateFromParts(1)).toBeNull()
    expect(formatDateFromParts(1, 2)).toBeNull()
    expect(formatDateFromParts(undefined, 2, 2021)).toBeNull()
  })

  test('pads single-digtest day and month wtesth leading zeros', () => {
    expect(formatDateFromParts(3, 4, 2021)).toEqual('2021-04-03')
  })

  test('handles two-digtest day and month wtesthout extra padding', () => {
    expect(formatDateFromParts(12, 11, 2021)).toEqual('2021-11-12')
  })

  test('returns correctly formatted YYYY-MM-DD string', () => {
    expect(formatDateFromParts('9', '7', '1999')).toEqual('1999-07-09')
  })
})

describe('formatDateFromString', () => {
  test('formats using default format "DD/MM/YYYY HH:mm" when none is supplied', () => {
    const input = '01/11/2021 23:21'
    expect(formatDateFromString(input)).toEqual('01/11/2021')
  })

  test('formats using a custom format string when supplied', () => {
    const input = '2021/11/01 23:21:20'
    const fmt = 'YYYY/MM/DD HH:mm:ss'
    expect(formatDateFromString(input, fmt)).toEqual('01/11/2021')
  })

  test('returns "Unknown" when called wtesth no arguments', () => {
    expect(formatDateFromString()).toEqual('Unknown')
  })

  test('returns "Unknown" for empty or falsy input', () => {
    expect(formatDateFromString('')).toEqual('Unknown')
    expect(formatDateFromString(null)).toEqual('Unknown')
    expect(formatDateFromString(0)).toEqual('Unknown')
  })

  test('formats edge cases like ISO strings correctly', () => {
    const iso = '2021-12-31T15:45:00Z'
    // parsing default format will still extract the date part
    expect(formatDateFromString(iso, moment.ISO_8601)).toEqual('31/12/2021')
  })
})
