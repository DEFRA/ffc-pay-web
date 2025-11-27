const { getAlertUpdateViewData } = require('../../../app/alerts/get-alert-update-view-data')
const { getAlertingData } = require('../../../app/api')
const { getAlertTypesAndSchemes } = require('../../../app/alerts/get-alert-types-and-schemes')

jest.mock('../../../app/api')
jest.mock('../../../app/alerts/get-alert-types-and-schemes')

describe('getAlertUpdateViewData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('returns correct view data when contactId is provided', async () => {
    const mockSchemes = [{ id: 1, name: 'SanitizedScheme1' }]
    const mockAlerts = ['alertA', 'alertB']
    const mockContactId = 'contact-123'
    const encodedId = encodeURIComponent(mockContactId)
    const mockContact = { emailAddress: 'user@example.com', alertA: ['scheme1', 'scheme2'], alertB: ['scheme3'] }
    const mockRequest = { auth: { credentials: { account: { name: 'John Doe' } } }, query: { contactId: mockContactId } }

    getAlertTypesAndSchemes.mockResolvedValue({ sanitizedSchemesPayload: mockSchemes, alertTypesPayload: mockAlerts })
    getAlertingData.mockResolvedValue({ payload: { contact: mockContact } })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(getAlertTypesAndSchemes).toHaveBeenCalled()
    expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodedId}`)
    expect(console.log).toHaveBeenCalledWith(`User John Doe has accessed the amend alert recipient page for ${mockContact.emailAddress}`)
    expect(result).toEqual({
      schemesPayload: mockSchemes,
      alertTypesPayload: mockAlerts,
      contactId: mockContactId,
      emailAddress: mockContact.emailAddress,
      selectedAlerts: { alertA: { scheme1: true, scheme2: true }, alertB: { scheme3: true } }
    })
  })

  test.each([
    [{ username: 'jane.doe' }, [], [], 'User jane.doe has accessed the amend alert recipient page for a new user', {}],
    [{ email: 'email@example.com' }, [], [], 'User email@example.com has accessed the amend alert recipient page for a new user', {}],
    [{}, [], [], 'User undefined has accessed the amend alert recipient page for a new user', {}]
  ])(
    'handles missing contactId and user info gracefully: %p',
    async (account, sanitizedSchemes, alertTypes, logMessage, selectedAlerts) => {
      const mockRequest = { auth: { credentials: { account } }, query: {} }
      getAlertTypesAndSchemes.mockResolvedValue({ sanitizedSchemesPayload: sanitizedSchemes, alertTypesPayload: alertTypes })

      const result = await getAlertUpdateViewData(mockRequest)

      expect(console.log).toHaveBeenCalledWith(logMessage)
      expect(result).toEqual({
        schemesPayload: sanitizedSchemes,
        alertTypesPayload: alertTypes,
        contactId: undefined,
        emailAddress: undefined,
        selectedAlerts
      })
    }
  )

  test.each([
    [{ emailAddress: 'user2@example.com' }, ['alert1', 'alert2'], 'contact-456'],
    [{}, ['alert1'], 'contact-missing-contact']
  ])(
    'handles contact payload with missing alert types or missing contact property: %p',
    async (contactPayload, alertTypes, contactId) => {
      const encodedId = encodeURIComponent(contactId)
      const mockSchemes = []
      const mockRequest = { auth: { credentials: { account: { name: contactPayload.emailAddress || 'Bob' } } }, query: { contactId } }

      getAlertTypesAndSchemes.mockResolvedValue({ sanitizedSchemesPayload: mockSchemes, alertTypesPayload: alertTypes })
      getAlertingData.mockResolvedValue({ payload: contactPayload.emailAddress !== undefined ? { contact: contactPayload } : {} })

      const result = await getAlertUpdateViewData(mockRequest)

      expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodedId}`)
      expect(console.log).toHaveBeenCalled()
      const expectedSelected = alertTypes.reduce((acc, type) => { acc[type] = contactPayload[type] ? Object.fromEntries(contactPayload[type].map(s => [s, true])) : {}; return acc }, {})
      expect(result).toEqual({
        schemesPayload: mockSchemes,
        alertTypesPayload: alertTypes,
        contactId,
        emailAddress: contactPayload.emailAddress,
        selectedAlerts: expectedSelected
      })
    }
  )

  test('propagates errors from getAlertTypesAndSchemes', async () => {
    const error = new Error('error in getAlertTypesAndSchemes')
    getAlertTypesAndSchemes.mockRejectedValue(error)
    const mockRequest = { auth: { credentials: { account: {} } }, query: {} }
    await expect(getAlertUpdateViewData(mockRequest)).rejects.toThrow('error in getAlertTypesAndSchemes')
  })

  test('propagates errors from getAlertingData', async () => {
    const error = new Error('error in getAlertingData')
    const mockContactId = 'contact-789'
    const mockRequest = { auth: { credentials: { account: { username: 'userX' } } }, query: { contactId: mockContactId } }
    getAlertTypesAndSchemes.mockResolvedValue({ sanitizedSchemesPayload: [], alertTypesPayload: [] })
    getAlertingData.mockRejectedValue(error)
    await expect(getAlertUpdateViewData(mockRequest)).rejects.toThrow('error in getAlertingData')
  })
})
