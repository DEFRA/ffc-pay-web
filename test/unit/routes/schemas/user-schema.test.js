const schema = require('../../../../app/routes/schemas/user-schema')

describe('update-contact-schema validation', () => {
  test('should validate a correct payload with action "edit"', () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: 123,
      action: 'edit',
      extraField: 'allowed'
    }

    const { error, value } = schema.validate(payload)

    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  test('should validate a correct payload with action "create" and empty contactId', () => {
    const payload = {
      emailAddress: 'create@example.com',
      contactId: '',
      action: 'create'
    }

    const { error, value } = schema.validate(payload)

    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  test('should fail if emailAddress is missing', () => {
    const payload = {
      contactId: 1,
      action: 'edit'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Email address is required')
  })

  test('should fail if emailAddress is not a string', () => {
    const payload = {
      emailAddress: 12345,
      contactId: 1,
      action: 'edit'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Email address must be a string')
  })

  test('should fail if emailAddress is invalid format', () => {
    const payload = {
      emailAddress: 'not-an-email',
      contactId: 1,
      action: 'edit'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Email address must be a valid email')
  })

  test('should fail if emailAddress is empty string', () => {
    const payload = {
      emailAddress: '',
      contactId: 1,
      action: 'edit'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Email address is required')
  })

  test('should fail if contactId is not a number or empty string', () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: 'not-a-number',
      action: 'edit'
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'An issue occurred linking this update to an existing record. Please inform the Payments & Documents Services team.'
    )
  })

  test('should allow contactId to be omitted', () => {
    const payload = {
      emailAddress: 'test@example.com',
      action: 'edit'
    }

    const { error, value } = schema.validate(payload)

    expect(error).toBeUndefined()
    expect(value).toEqual(payload)
  })

  test('should fail if action is missing', () => {
    const payload = {
      emailAddress: 'test@example.com',
      contactId: 1
    }

    const { error } = schema.validate(payload)

    expect(error).toBeDefined()
    expect(error.details[0].message).toBe('Action is required')
  })
})
