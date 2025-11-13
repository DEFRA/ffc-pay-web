jest.mock('../../../../app/config', () => ({
  devTeamEmails: 'dev1@example.com; dev2@company.com',
  approvedEmailDomains: 'example.com; @company.com; approved.org'
}))

const { isEmailBlocked } = require('../../../../app/alerts/validation')

describe('isEmailBlocked', () => {
  test('returns true for null, undefined, or non-string inputs', () => {
    expect(isEmailBlocked(null)).toBe(true)
    expect(isEmailBlocked(undefined)).toBe(true)
    expect(isEmailBlocked(123)).toBe(true)
    expect(isEmailBlocked({})).toBe(true)
    expect(isEmailBlocked('')).toBe(true)
    expect(isEmailBlocked('   ')).toBe(true)
  })

  test('returns false for emails explicitly listed in devTeamEmails', () => {
    expect(isEmailBlocked('dev1@example.com')).toBe(false)
    expect(isEmailBlocked(' DEV1@EXAMPLE.COM ')).toBe(false)
    expect(isEmailBlocked('dev2@company.com')).toBe(false)
  })

  test('returns false for emails with approved domains', () => {
    expect(isEmailBlocked('user@example.com')).toBe(false)
    expect(isEmailBlocked('user@company.com')).toBe(false)
    expect(isEmailBlocked('someone@approved.org')).toBe(false)
    expect(isEmailBlocked('USER@EXAMPLE.COM')).toBe(false)
  })

  test('returns true for emails with domains not in approved list', () => {
    expect(isEmailBlocked('user@notapproved.com')).toBe(true)
    expect(isEmailBlocked('user@unknown.org')).toBe(true)
  })

  test('returns true for malformed emails or missing domain', () => {
    expect(isEmailBlocked('user@')).toBe(true)
    expect(isEmailBlocked('user')).toBe(true)
    expect(isEmailBlocked('user@.com')).toBe(true)
  })
})
