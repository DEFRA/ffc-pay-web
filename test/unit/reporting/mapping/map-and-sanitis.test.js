const { mapAndSanitize } = require('../../../../app/reporting/mapping/map-and-sanitise')
const { getPoundValue } = require('../../../../app/helpers/get-pound-value')
const { convertDateToDDMMYYYY } = require('../../../../app/helpers/convert-date-to-ddmmyyyy')

jest.mock('../../../../app/helpers/get-pound-value', () => ({
  getPoundValue: jest.fn(val => `£${val}`)
}))

jest.mock('../../../../app/helpers/convert-date-to-ddmmyyyy', () => ({
  convertDateToDDMMYYYY: jest.fn(date => `formatted(${date})`)
}))

describe('mapAndSanitize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['value field', { Amount: 'some.nested.deltaAmount' }, { some: { nested: { deltaAmount: 200 } } }, '£200', getPoundValue],
    ['date field', { Date: 'info.batchExportDate' }, { info: { batchExportDate: '2020-12-31' } }, 'formatted(2020-12-31)', convertDateToDDMMYYYY],
    ['raw field', { Name: 'user.name' }, { user: { name: 'Alice' } }, 'Alice', null],
    ['missing nested property', { Name: 'user.name' }, { user: {} }, undefined, null]
  ])('should handle %s correctly', (_, fieldMap, data, expectedValue, mockFn) => {
    const result = mapAndSanitize(data, fieldMap)
    const key = Object.keys(fieldMap)[0]
    expect(result[key]).toEqual(expectedValue)
    if (mockFn) {
      expect(mockFn).toHaveBeenCalled()
    }
  })

  test('should correctly process multiple fields', () => {
    const fieldMap = {
      Amount: 'payment.apValue',
      Date: 'payment.lastUpdated',
      Other: 'payment.note'
    }
    const data = {
      payment: { apValue: 500, lastUpdated: '2021-05-05', note: 'Test note' }
    }
    const result = mapAndSanitize(data, fieldMap)
    expect(getPoundValue).toHaveBeenCalledWith(500)
    expect(convertDateToDDMMYYYY).toHaveBeenCalledWith('2021-05-05')
    expect(result).toEqual({
      Amount: '£500',
      Date: 'formatted(2021-05-05)',
      Other: 'Test note'
    })
  })
})
