const schema = require('../../../../app/routes/schemas/remove-user-schema')

describe('remove-contact-schema validation', () => {
  test('should validate a correct payload', () => {
    const payload = {
      contactId: 123,
      action: 'remove',
      extraField: 'allowed'
    }

    const { error, value } = schema.validate(payload)

    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  test('should fail if contactId is missing', () => {
    const payload = {
      action: 'remove'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('A user must be specified to remove')
  })

  test('should fail if contactId is not a number', () => {
    const payload = {
      contactId: 'abc',
      action: 'remove'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('A user must be specified to remove')
  })

  test('should fail if action is missing', () => {
    const payload = {
      contactId: 1
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Action is required')
  })
})
