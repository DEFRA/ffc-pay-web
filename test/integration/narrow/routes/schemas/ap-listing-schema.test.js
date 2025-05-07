const schema = require('../../../../../app/routes/schemas/ap-ar-listing-schema')

describe('AP Listing Schema', () => {
  test('should return error when start date is partially provided', () => {
    const data = {
      'start-date-day': 1,
      'start-date-month': '',
      'start-date-year': 2022
    }

    const { error } = schema.validate(data)
    expect(error).toBeDefined()
    expect(error.message).toEqual(
      'Start date must include day, month, and year'
    )
  })

  test('should return error when end date is partially provided', () => {
    const data = {
      'end-date-day': 1,
      'end-date-month': '',
      'end-date-year': 2022
    }

    const { error } = schema.validate(data)
    expect(error).toBeDefined()
    expect(error.message).toEqual('End date must include day, month, and year')
  })

  test('should return error when end date is less than start date', () => {
    const data = {
      'start-date-day': 2,
      'start-date-month': 2,
      'start-date-year': 2022,
      'end-date-day': 1,
      'end-date-month': 2,
      'end-date-year': 2022
    }

    const { error } = schema.validate(data)
    expect(error).toBeDefined()
    expect(error.message).toEqual('End date cannot be less than start date')
  })
})
