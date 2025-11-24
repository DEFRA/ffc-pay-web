const mapAuth = require('../../../app/auth/map-auth')
const {
  holdAdmin,
  schemeAdmin,
  closureAdmin,
  applicationAdmin
} = require('../../../app/auth/permissions')

let request

describe('mapAuth', () => {
  beforeEach(() => {
    request = {
      auth: {
        isAuthenticated: true,
        credentials: { scope: [] }
      }
    }
  })

  test.each([
    ['authenticated', true, true, false],
    ['unauthenticated', false, false, true]
  ])(
    'should set isAuthenticated/isAnonymous correctly when %s',
    (_, isAuth, expectedAuth, expectedAnon) => {
      request.auth.isAuthenticated = isAuth
      const result = mapAuth(request)
      expect(result.isAuthenticated).toBe(expectedAuth)
      expect(result.isAnonymous).toBe(expectedAnon)
    }
  )

  test.each([
    ['application admin', applicationAdmin, 'isApplicationAdmin'],
    ['hold admin', holdAdmin, 'isHoldAdminUser'],
    ['scheme admin', schemeAdmin, 'isSchemeAdminUser'],
    ['closure admin', closureAdmin, 'isClosureAdminUser']
  ])('should return false for %s when no roles', (_, __, prop) => {
    const result = mapAuth(request)
    expect(result[prop]).toBeFalsy()
  })

  test.each([
    ['non-hold role', [schemeAdmin], 'isHoldAdminUser'],
    ['non-scheme role', [holdAdmin], 'isSchemeAdminUser'],
    ['non-closure role', [schemeAdmin], 'isClosureAdminUser']
  ])('should return false for %s when not in role', (_, roles, prop) => {
    request.auth.credentials.scope = roles
    const result = mapAuth(request)
    expect(result[prop]).toBeFalsy()
  })

  test.each([
    ['application admin', applicationAdmin, 'isApplicationAdmin'],
    ['hold admin', holdAdmin, 'isHoldAdminUser'],
    ['scheme admin', schemeAdmin, 'isSchemeAdminUser'],
    ['closure admin', closureAdmin, 'isClosureAdminUser']
  ])('should return true for %s when in role', (_, role, prop) => {
    request.auth.credentials.scope = [role]
    const result = mapAuth(request)
    expect(result[prop]).toBeTruthy()
  })
})
