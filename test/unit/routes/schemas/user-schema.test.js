const schema = require('../../../../app/routes/schemas/user-schema')

describe('update-contact-schema validation', () => {
  const baseValidEdit = {
    emailAddress: 'test@example.com',
    contactId: 123,
    action: 'edit'
  }

  const baseValidCreate = {
    emailAddress: 'create@example.com',
    contactId: '',
    action: 'create'
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
      [{ contactId: 1, action: 'edit' }, 'Email address is required'],
      [{ emailAddress: 12345, contactId: 1, action: 'edit' }, 'Email address must be a string'],
      [{ emailAddress: 'not-an-email', contactId: 1, action: 'edit' }, 'Email address must be a valid email'],
      [{ emailAddress: '', contactId: 1, action: 'edit' }, 'Email address is required']
    ])('invalid emailAddress %# produces expected error', (payload, expectedMessage) => {
      const { error } = schema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(expectedMessage)
    })
  })

  describe('contactId validation', () => {
    test('invalid contactId produces expected error', () => {
      const payload = { emailAddress: 'test@example.com', contactId: 'not-a-number', action: 'edit' }
      const { error } = schema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'An issue occurred linking this update to an existing record. Please inform the Payments & Documents Services team.'
      )
    })

    test('omitted contactId is allowed', () => {
      const payload = { emailAddress: 'test@example.com', action: 'edit' }
      const { error, value } = schema.validate(payload)
      expect(error).toBeUndefined()
      expect(value).toEqual(payload)
    })
  })

  test('missing action produces expected error', () => {
    const payload = { emailAddress: 'test@example.com', contactId: 1 }
    const { error } = schema.validate(payload)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Action is required')
  })
})
