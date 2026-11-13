const monitoringDateSchema = require('../../../../app/routes/schemas/monitoring-date-schema')

describe('monitoringDateSchema', () => {
  const validDate = {
    schemeId: 123,
    day: 29,
    month: 2,
    year: 2024
  }

  test('accepts a valid date, including a leap day', () => {
    const { error, value } = monitoringDateSchema.validate(validDate)

    expect(error).toBeUndefined()
    expect(value).toEqual(validDate)
  })

  test.each([
    [{ ...validDate, day: 29, month: 2, year: 2023 }, 'Enter a valid date'],
    [{ ...validDate, day: 31, month: 4 }, 'Enter a valid date']
  ])('rejects an invalid calendar date', (value, message) => {
    const { error } = monitoringDateSchema.validate(value)

    expect(error.details[0].message).toBe(message)
  })

  test.each([
    [{ ...validDate, schemeId: undefined }, 'Select a scheme'],
    [{ ...validDate, schemeId: 'invalid' }, 'Select a valid scheme'],
    [{ ...validDate, day: undefined }, 'Day is required'],
    [{ ...validDate, day: 1.5 }, 'Day must be a whole number'],
    [{ ...validDate, day: 0 }, 'Day is out of range'],
    [{ ...validDate, day: 32 }, 'Day is out of range'],
    [{ ...validDate, month: 0 }, 'Month is out of range'],
    [{ ...validDate, month: 13 }, 'Month is out of range'],
    [{ ...validDate, year: 0 }, 'Year is out of range'],
    [{ ...validDate, year: 10000 }, 'Year is out of range']
  ])('rejects invalid input with the expected message', (value, message) => {
    const { error } = monitoringDateSchema.validate(value)

    expect(error.details[0].message).toBe(message)
  })
})
