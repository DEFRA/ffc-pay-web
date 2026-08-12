const schema = require('../../../../app/routes/schemas/user-schema')

describe('update-contact-schema validation', () => {
  const baseValidEdit = {
    emailAddress: 'test@example.com',
    contactId: 123,
    action: 'edit',
    1: 'EMAIL'
  }

  const baseValidCreate = {
    emailAddress: 'create@example.com',
    contactId: '',
    action: 'create',
    1: ['EMAIL', 'SMS']
  }

  test.each([
    [baseValidEdit],
    [baseValidCreate]
  ])('valid payload %# passes validation', (payload) => {
    const { error, value } = schema.validate(payload)
    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  describe('emailAddress validation', () => {
    test.each([
      [{ contactId: 1, action: 'edit', 1: 'EMAIL' }, 'Email address is required'],
      [{ emailAddress: 12345, contactId: 1, action: 'edit', 1: 'EMAIL' }, 'Email address must be a string'],
      [{ emailAddress: 'not-an-email', contactId: 1, action: 'edit', 1: 'EMAIL' }, 'Email address must be a valid email'],
      [{ emailAddress: '', contactId: 1, action: 'edit', 1: 'EMAIL' }, 'Email address is required']
    ])('invalid emailAddress %# produces expected error', (payload, expectedMessage) => {
      const { error } = schema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(expectedMessage)
    })
  })

  describe('contactId validation', () => {
    test('invalid contactId produces expected error', () => {
      const payload = { emailAddress: 'test@example.com', contactId: 'not-a-number', action: 'edit', 1: 'EMAIL' }
      const { error } = schema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'An issue occurred linking this update to an existing record. Please inform the Payments & Documents Services team.'
      )
    })

    test('omitted contactId is allowed', () => {
      const payload = { emailAddress: 'test@example.com', action: 'edit', 1: 'EMAIL' }
      const { error, value } = schema.validate(payload)
      expect(error).toBeUndefined()
      expect(value).toEqual(payload)
    })
  })

  test('missing action produces expected error', () => {
    const payload = { emailAddress: 'test@example.com', contactId: 1, 1: 'EMAIL' }
    const { error } = schema.validate(payload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Action is required')
  })

  test('invalid action produces expected error', () => {
    const payload = { emailAddress: 'test@example.com', contactId: 1, action: 'remove', 1: 'EMAIL' }
    const { error } = schema.validate(payload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Action must be edit or create')
  })

  test('requires at least one alert type to be selected', () => {
    const payload = { emailAddress: 'test@example.com', contactId: 1, action: 'edit' }
    const { error } = schema.validate(payload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Select at least one alert type')
  })

  test('allows unknown fields in payload', () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: 1,
      action: 'edit',
      1: 'EMAIL',
      crumb: 'ignored',
      schemeId: '2',
      extraField: 'extra'
    }
    const { error, value } = schema.validate(payload)
    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })
})
