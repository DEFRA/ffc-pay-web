jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

const { getAlertingData } = require('../../../../app/api')
const { isEmailTaken } = require('../../../../app/alerts/validation')

describe('isEmailTaken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns false if no contact found in response', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBe(false)
  })

  test('returns false if contactId matches given contactId', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 123 } } })
    await expect(isEmailTaken('test@example.com', 123)).resolves.toBe(false)
  })

  test('returns true if contactId exists and differs from given contactId (number input)', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 456 } } })
    await expect(isEmailTaken('test@example.com', 123)).resolves.toBe(true)
  })

  test('returns true if contactId exists and differs from given contactId (string input)', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 789 } } })
    await expect(isEmailTaken('test@example.com', '123')).resolves.toBe(true)
  })

  test('handles missing payload or contact gracefully and returns false', async () => {
    getAlertingData.mockResolvedValue({})
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBe(false)

    getAlertingData.mockResolvedValue({ payload: {} })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBe(false)
  })

  test('calls getAlertingData with encoded email endpoint', async () => {
    const email = 'user+test@example.com'
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await isEmailTaken(email, 1)
    expect(getAlertingData).toHaveBeenCalledWith('/contact/email/user%2Btest%40example.com')
  })
})
