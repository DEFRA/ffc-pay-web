jest.mock('../../../../app/config', () => ({
  approvedEmailDomains: 'example.com; @company.com; approved.org'
}))

const { isEmailBlocked } = require('../../../../app/alerts/validation')

describe('isEmailBlocked', () => {
  test('throws error for null, undefined, or non-string inputs', () => {
    expect(() => isEmailBlocked(null)).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked(undefined)).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked(123)).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked({})).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked('')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked('   ')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
  })

  test('does not throw for emails with approved domains', () => {
    expect(() => isEmailBlocked('user@example.com')).not.toThrow()
    expect(() => isEmailBlocked('user@company.com')).not.toThrow()
    expect(() => isEmailBlocked('someone@approved.org')).not.toThrow()
    expect(() => isEmailBlocked('USER@EXAMPLE.COM')).not.toThrow()
    expect(() => isEmailBlocked(' user@company.com  ')).not.toThrow()
  })

  test('throws error for emails with domains not in approved list', () => {
    expect(() => isEmailBlocked('user@notapproved.com')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked('user@unknown.org')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
  })

  test('throws error for malformed emails or missing domain', () => {
    expect(() => isEmailBlocked('user@')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked('user')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
    expect(() => isEmailBlocked('user@.com')).toThrow(
      'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'
    )
  })
})
