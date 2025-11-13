const { removeAlertUser } = require('../../../app/alerts/remove-alert-user')
const { postAlerting } = require('../../../app/api')

jest.mock('../../../app/api')

describe('removeAlertUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call postAlerting with correct parameters and redirect to /alerts', async () => {
    const removedBy = 'adminUser'
    const contactId = 'contact-123'
    const mockRedirect = jest.fn()
    const h = { redirect: mockRedirect }

    postAlerting.mockResolvedValue()

    const result = await removeAlertUser(removedBy, contactId, h)

    expect(postAlerting).toHaveBeenCalledWith('/remove-contact', { removedBy, contactId }, null)
    expect(mockRedirect).toHaveBeenCalledWith('/alerts')
    expect(result).toBe(mockRedirect.mock.results[0].value)
  })

  test('should surface errors from postAlerting', async () => {
    const removedBy = 'adminUser'
    const contactId = 'contact-456'
    const h = { redirect: jest.fn() }

    const error = new Error('postAlerting failed')
    postAlerting.mockRejectedValue(error)

    await expect(removeAlertUser(removedBy, contactId, h)).rejects.toThrow('postAlerting failed')
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
