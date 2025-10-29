const searchSchema = require('../../../../app/routes/schemas/hold-search')
jest.mock('../../../../app/auth')

test('should return error when FRN is not 10 digits', () => {
  const data = { frn: 123456789 }

  const { error } = searchSchema.validate(data)

  expect(error.details[0].message).toEqual('Enter a 10-digit FRN')
})

test('should not return error when FRN is 10 digits', () => {
  const data = { frn: 1234567890 }

  const { error } = searchSchema.validate(data)

  expect(error).toBeUndefined()
})
