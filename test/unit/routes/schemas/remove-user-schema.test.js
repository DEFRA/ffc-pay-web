const schema = require('../../../../app/routes/schemas/remove-user-schema')

describe('remove-contact-schema validation', () => {
  test('valid payload passes validation', () => {
    const payload = { contactId: 123, action: 'remove', extraField: 'allowed' }
    const { error, value } = schema.validate(payload)
    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  test.each([
    [{ action: 'remove' }, 'A user must be specified to remove'],
    [{ contactId: 'abc', action: 'remove' }, 'A user must be specified to remove'],
    [{ contactId: 1 }, 'Action is required']
  ])('invalid payload %o fails with message "%s"', (payload, expectedMessage) => {
    const { error } = schema.validate(payload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(expectedMessage)
  })
})
