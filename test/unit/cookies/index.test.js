const { getCurrentPolicy, updatePolicy } = require('../../../app/cookies')

describe('cookies module', () => {
  test('getCurrentPolicy returns existing policy when present', () => {
    const existing = { analytics: true, confirmed: true, essential: true }
    const req = { state: { cookies_policy: existing } }
    const h = { state: jest.fn(), unstate: jest.fn() }

    const result = getCurrentPolicy(req, h)
    expect(result).toBe(existing)
    expect(h.state).not.toHaveBeenCalled()
  })

  test('getCurrentPolicy creates and stores default policy when missing', () => {
    const req = { state: {} }
    const h = { state: jest.fn(), unstate: jest.fn() }

    const result = getCurrentPolicy(req, h)
    expect(result).toEqual(expect.objectContaining({
      confirmed: false,
      essential: true,
      analytics: false
    }))
    expect(h.state).toHaveBeenCalledWith(
      'cookies_policy',
      expect.objectContaining({ confirmed: false, essential: true, analytics: false }),
      expect.any(Object)
    )
  })

  test('updatePolicy updates existing policy and sets confirmed', () => {
    const policy = { analytics: false, confirmed: false, essential: true }
    const req = { state: { cookies_policy: policy } }
    const h = { state: jest.fn(), unstate: jest.fn() }

    updatePolicy(req, h, true)

    expect(policy.analytics).toBe(true)
    expect(policy.confirmed).toBe(true)
    expect(h.state).toHaveBeenCalledWith('cookies_policy', policy, expect.any(Object))
    expect(h.unstate).not.toHaveBeenCalled()
  })

  test('updatePolicy creates default when missing and removes GA cookies when analytics false', () => {
    const req = { state: {} }
    const h = { state: jest.fn(), unstate: jest.fn() }

    updatePolicy(req, h, false)

    expect(h.state).toHaveBeenCalled()
    expect(h.unstate).toHaveBeenCalledWith('_ga')
    expect(h.unstate).toHaveBeenCalledWith('_gid')
  })
})
