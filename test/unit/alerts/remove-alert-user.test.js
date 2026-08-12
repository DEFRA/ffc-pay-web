jest.mock('../../../app/api', () => ({
  postAlerting: jest.fn()
}))

const { postAlerting } = require('../../../app/api')
const { removeAlertUser } = require('../../../app/alerts/remove-alert-user')

describe('removeAlertUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call postAlerting with correct parameters and redirect to manage-by-recipient', async () => {
    const removedBy = 'adminUser'
    const contactId = 'contact-123'
    const emailAddress = 'user@example.com'
    const mockRedirect = jest.fn().mockReturnValue('redirected')
    const h = { redirect: mockRedirect }

    postAlerting.mockResolvedValue()

    const result = await removeAlertUser(removedBy, contactId, emailAddress, h)

    expect(postAlerting).toHaveBeenCalledWith(
      '/remove-contact',
      { removedBy, contactId },
      null
    )
    expect(mockRedirect).toHaveBeenCalledWith(
      '/alerts/manage-by-recipient?removed=user%40example.com'
    )
    expect(result).toBe('redirected')
  })

  test('should surface errors from postAlerting', async () => {
    const removedBy = 'adminUser'
    const contactId = 'contact-456'
    const emailAddress = 'user@example.com'
    const h = { redirect: jest.fn() }

    const error = new Error('postAlerting failed')
    postAlerting.mockRejectedValue(error)

    await expect(
      removeAlertUser(removedBy, contactId, emailAddress, h)
    ).rejects.toThrow('postAlerting failed')
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
