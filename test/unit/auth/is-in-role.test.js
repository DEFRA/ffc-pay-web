const isInRole = require('../../../app/auth/is-in-role')

const ROLE_1 = 'role1'
const ROLE_2 = 'role2'
const ROLE_3 = 'role3'
let credentials

describe('is in role', () => {
  beforeEach(() => {
    credentials = {
      scope: [ROLE_1, ROLE_2]
    }
  })

  test('should return true if in role', () => {
    expect(isInRole(credentials, ROLE_1)).toBeTruthy()
  })

  test('should return false if not in role', () => {
    expect(isInRole(credentials, ROLE_3)).toBeFalsy()
  })

  test.each([
    ['no roles', { scope: [] }],
    ['no scope property', {}],
    ['null credentials', null],
    ['undefined credentials', undefined]
  ])('should return false if %s', (_, creds) => {
    expect(isInRole(creds, ROLE_3)).toBeFalsy()
  })
})
