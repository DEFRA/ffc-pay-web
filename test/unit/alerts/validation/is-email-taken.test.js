jest.mock('../../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

const { getAlertingData } = require('../../../../app/api')
const { isEmailTaken } = require('../../../../app/alerts/validation')

describe('isEmailTaken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('resolves if no contact found', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()
  })

  test('resolves if contactId matches', async () => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: 123 } } })
    await expect(isEmailTaken('test@example.com', 123)).resolves.toBeUndefined()
  })

  test.each([
    [456, 123],
    [789, '123']
  ])('throws if contactId exists and differs (contactId: %p, given: %p)', async (foundId, givenId) => {
    getAlertingData.mockResolvedValue({ payload: { contact: { contactId: foundId } } })
    await expect(isEmailTaken('test@example.com', givenId)).rejects.toThrow(
      'The email address test@example.com is already registered'
    )
  })

  test('handles missing payload or contact without throwing', async () => {
    getAlertingData.mockResolvedValue({})
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()

    getAlertingData.mockResolvedValue({ payload: {} })
    await expect(isEmailTaken('test@example.com', 1)).resolves.toBeUndefined()
  })

  test('calls getAlertingData with encoded email', async () => {
    const email = 'user+test@example.com'
    getAlertingData.mockResolvedValue({ payload: { contact: null } })
    await isEmailTaken(email, 1)
    expect(getAlertingData).toHaveBeenCalledWith('/contact/email/user%2Btest%40example.com')
  })
})
