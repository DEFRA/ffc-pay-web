const schema = require('../../../../app/routes/schemas/ap-ar-report-schema')
const { AP, AR } = require('../../../../app/constants/report-types')

describe('AP‑AR Listing Schema', () => {
  test('errors when report‑title is missing', () => {
    const { error } = schema.validate({
      'report-url': '/foo',
      'report-type': AP
    })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/"report-title" is required/)
  })

  test('errors when report‑url is missing', () => {
    const { error } = schema.validate({
      'report-title': 'Foo',
      'report-type': AR
    })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/"report-url" is required/)
  })

  test('errors when report‑type is not one of allowed', () => {
    const { error } = schema.validate({
      'report-title': 'Foo',
      'report-url': '/foo',
      'report-type': 'INVALID'
    })
    expect(error).toBeDefined()
    expect(error.message).toMatch(/"report-type" must be one of/)
  })

  test('errors when start date is partially provided', () => {
    const { error } = schema.validate({
      'report-title': 'Foo',
      'report-url': '/foo',
      'report-type': AP,
      'start-date-day': 1,
      'start-date-month': '',
      'start-date-year': 2022
    })
    expect(error).toBeDefined()
    expect(error.message).toEqual('Start date must include day, month, and year')
  })

  test('errors when end date is partially provided', () => {
    const { error } = schema.validate({
      'report-title': 'Foo',
      'report-url': '/foo',
      'report-type': AR,
      'end-date-day': 5,
      'end-date-month': 6,
      'end-date-year': ''
    })
    expect(error).toBeDefined()
    expect(error.message).toEqual('End date must include day, month, and year')
  })

  test('errors when end date is before start date', () => {
    const { error } = schema.validate({
      'report-title': 'Foo',
      'report-url': '/foo',
      'report-type': AP,
      'start-date-day': 10,
      'start-date-month': 3,
      'start-date-year': 2022,
      'end-date-day': 9,
      'end-date-month': 3,
      'end-date-year': 2022
    })
    expect(error).toBeDefined()
    expect(error.message).toEqual('End date cannot be less than start date')
  })

  test('passes when all required fields and valid dates are provided', () => {
    const good = {
      'report-title': 'Foo Report',
      'report-url': '/foo',
      'report-type': AR,
      'start-date-day': 1,
      'start-date-month': 1,
      'start-date-year': 2022,
      'end-date-day': 2,
      'end-date-month': 1,
      'end-date-year': 2022
    }
    const { error, value } = schema.validate(good)
    expect(error).toBeUndefined()
    expect(value['report-title']).toBe('Foo Report')
    expect(value['report-type']).toBe(AR)
    expect(value['start-date-day']).toBe(1)
    expect(value['end-date-year']).toBe(2022)
  })
})
