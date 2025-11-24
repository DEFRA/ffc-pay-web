jest.mock('../../../../app/config', () => ({
  approvedEmailDomains: 'example.com; @company.com; approved.org'
}))

const { isEmailBlocked } = require('../../../../app/alerts/validation')

const ERROR_MSG =
  'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.'

describe('isEmailBlocked', () => {
  test.each([null, undefined, 123, {}, '', '   '])(
    'throws error for invalid input: %p',
    (input) => {
      expect(() => isEmailBlocked(input)).toThrow(ERROR_MSG)
    }
  )

  test.each([
    'user@example.com',
    'user@company.com',
    'someone@approved.org',
    'USER@EXAMPLE.COM',
    ' user@company.com  '
  ])('does not throw for approved email: %s', (email) => {
    expect(() => isEmailBlocked(email)).not.toThrow()
  })

  test.each(['user@notapproved.com', 'user@unknown.org'])(
    'throws error for unapproved domain: %s',
    (email) => {
      expect(() => isEmailBlocked(email)).toThrow(ERROR_MSG)
    }
  )

  test.each(['user@', 'user', 'user@.com'])(
    'throws error for malformed email: %s',
    (email) => {
      expect(() => isEmailBlocked(email)).toThrow(ERROR_MSG)
    }
  )
})
