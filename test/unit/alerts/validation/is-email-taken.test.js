jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

const { getAlertingData } = require('../../../../app/api')
const { isEmailTaken } = require('../../../../app/alerts/validation')

describe('isEmailTaken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('does not throw if no contact found in response', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()
  })

  test('does not throw if contactId matches given contactId', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 123 } } })
    await expect(isEmailTaken('test@example.com', 123)).resolves.toBeUndefined()
  })

  test('throws error if contactId exists and differs from given contactId (number input)', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 456 } } })
    await expect(isEmailTaken('test@example.com', 123)).rejects.toThrow(
      'The email address test@example.com is already registered'
    )
  })

  test('throws error if contactId exists and differs from given contactId (string input)', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 789 } } })
    await expect(isEmailTaken('test@example.com', '123')).rejects.toThrow(
      'The email address test@example.com is already registered'
    )
  })

  test('handles missing payload or contact gracefully and does not throw', async () => {
    getAlertingData.mockResolvedValue({})
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()

    getAlertingData.mockResolvedValue({ payload: {} })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()
  })

  test('calls getAlertingData with encoded email endpoint', async () => {
    const email = 'user+test@example.com'
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await isEmailTaken(email, 1)
    expect(getAlertingData).toHaveBeenCalledWith('/contact/email/user%2Btest%40example.com')
  })
})
