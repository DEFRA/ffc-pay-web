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
    getPoundValue.mockClear()
    convertDateToDDMMYYYY.mockClear()
  })

  test('should sanitize value field using getPoundValue', () => {
    const fieldMap = { Amount: 'some.nested.deltaAmount' }
    const data = { some: { nested: { deltaAmount: 200 } } }
    const result = mapAndSanitize(data, fieldMap)
    expect(getPoundValue).toHaveBeenCalledWith(200)
    expect(result).toEqual({ Amount: '£200' })
  })

  test('should sanitize date field using convertDateToDDMMYYYY', () => {
    const fieldMap = { Date: 'info.batchExportDate' }
    const data = { info: { batchExportDate: '2020-12-31' } }
    const result = mapAndSanitize(data, fieldMap)
    expect(convertDateToDDMMYYYY).toHaveBeenCalledWith('2020-12-31')
    expect(result).toEqual({ Date: 'formatted(2020-12-31)' })
  })

  test('should return raw value when field is not value or date', () => {
    const fieldMap = { Name: 'user.name' }
    const data = { user: { name: 'Alice' } }
    const result = mapAndSanitize(data, fieldMap)
    expect(result).toEqual({ Name: 'Alice' })
  })

  test('should handle missing nested properties gracefully', () => {
    const fieldMap = { Name: 'user.name' }
    const data = { user: {} }
    const result = mapAndSanitize(data, fieldMap)
    expect(result).toEqual({ Name: undefined })
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
