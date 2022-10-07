const mapAuth = require('../../../app/auth/map-auth')
const { holdAdmin, schemeAdmin } = require('../../../app/auth/permissions')
let request

describe('is in role', () => {
  beforeEach(() => {
    request = {
      auth: {
        isAuthenticated: true,
        credentials: {
          scope: []
        }
      }
    }
  })

  test('should return isAuthenticated if authenticated', () => {
    const result = mapAuth(request)
    expect(result.isAuthenticated).toBeTruthy()
  })

  test('should not return isAuthenticated if unauthenticated', () => {
    request.auth.isAuthenticated = false
    const result = mapAuth(request)
    expect(result.isAuthenticated).not.toBeTruthy()
  })

  test('should return isAnonymous if unauthenticated', () => {
    request.auth.isAuthenticated = false
    const result = mapAuth(request)
    expect(result.isAnonymous).toBeTruthy()
  })

  test('should not return isAnonymous if authenticated', () => {
    const result = mapAuth(request)
    expect(result.isAnonymous).not.toBeTruthy()
  })

  test('should not return isHoldAdminUser if no roles', () => {
    const result = mapAuth(request)
    expect(result.isHoldAdminUser).not.toBeTruthy()
  })

  test('should not return isSchemeAdminUser if no roles', () => {
    const result = mapAuth(request)
    expect(result.isSchemeAdminUser).not.toBeTruthy()
  })

  test('should not return isHoldAdminUser if not in role', () => {
    request.auth.credentials.scope = [schemeAdmin]
    const result = mapAuth(request)
    expect(result.isHoldAdminUser).not.toBeTruthy()
  })

  test('should not return isSchemeAdminUser if not in role', () => {
    request.auth.credentials.scope = [holdAdmin]
    const result = mapAuth(request)
    expect(result.isSchemeAdminUser).not.toBeTruthy()
  })

  test('should return isHoldAdminUser if in role', () => {
    request.auth.credentials.scope = [holdAdmin]
    const result = mapAuth(request)
    expect(result.isHoldAdminUser).toBeTruthy()
  })

  test('should return isSchemeAdminUser if in role', () => {
    request.auth.credentials.scope = [schemeAdmin]
    const result = mapAuth(request)
    expect(result.isSchemeAdminUser).toBeTruthy()
  })
})
