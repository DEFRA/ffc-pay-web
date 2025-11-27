const schema = require('../../../../app/routes/schemas/ap-ar-report-schema')
const { AP, AR } = require('../../../../app/constants/report-types')

describe('AP‑AR Listing Schema', () => {
  const baseValid = {
    'report-title': 'Foo Report',
    'report-url': '/foo',
    'select-type': AP,
    'start-date-day': 1,
    'start-date-month': 1,
    'start-date-year': 2022,
    'end-date-day': 2,
    'end-date-month': 1,
    'end-date-year': 2022
  }

  test.each([
    [{ ...baseValid, 'report-title': undefined }, /"report-title" is required/],
    [{ ...baseValid, 'report-url': undefined }, /"report-url" is required/],
    [{ ...baseValid, 'select-type': 'INVALID' }, /"select-type" must be one of/],
    [{ ...baseValid, 'start-date-day': 1, 'start-date-month': '', 'start-date-year': 2022 }, /Start date must include day, month, and year/],
    [{ ...baseValid, 'end-date-day': 5, 'end-date-month': 6, 'end-date-year': '' }, /End date must include day, month, and year/],
    [{ ...baseValid, 'start-date-day': 10, 'start-date-month': 3, 'start-date-year': 2022, 'end-date-day': 9, 'end-date-month': 3, 'end-date-year': 2022 }, /End date cannot be less than start date/]
  ])('invalid input %# produces expected error', (invalidInput, expectedMessage) => {
    const { error } = schema.validate(invalidInput)
    expect(error).toBeDefined()
    expect(error.message).toMatch(expectedMessage)
  })

  test.each([
    [{ ...baseValid, 'select-type': AP }, 'AP valid input passes'],
    [{ ...baseValid, 'select-type': AR }, 'AR valid input passes']
  ])('%s', (validInput) => {
    const { error, value } = schema.validate(validInput)
    expect(error).toBeUndefined()
    expect(value['report-title']).toBe(validInput['report-title'])
    expect(value['select-type']).toBe(validInput['select-type'])
  })
})
