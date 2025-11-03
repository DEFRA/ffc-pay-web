const { getAlertUpdateViewData } = require('../../../app/alerts/get-alert-update-view-data')
const { getAlertingData } = require('../../../app/api')
const { getAlertTypesAndSchemes } = require('../../../app/alerts/get-alert-types-and-schemes')

jest.mock('../../../app/api')
jest.mock('../../../app/alerts/get-alert-types-and-schemes')

describe('getAlertUpdateViewData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('should return correct view data when contactId is provided', async () => {
    const mockSanitizedSchemes = [{ id: 1, name: 'SanitizedScheme1' }]
    const mockAlertTypesPayload = ['alertA', 'alertB']
    const mockContactId = 'contact-123'
    const encodedContactId = encodeURIComponent(mockContactId)
    const mockContactPayload = {
      emailAddress: 'user@example.com',
      alertA: ['scheme1', 'scheme2'],
      alertB: ['scheme3']
    }
    const mockRequest = {
      auth: {
        credentials: {
          account: {
            name: 'John Doe'
          }
        }
      },
      query: {
        contactId: mockContactId
      }
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    getAlertingData.mockResolvedValue({
      payload: {
        contact: mockContactPayload
      }
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(getAlertTypesAndSchemes).toHaveBeenCalled()
    expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodedContactId}`)
    expect(console.log).toHaveBeenCalledWith(
      `User John Doe has accessed the amend alert recipient page for ${mockContactPayload.emailAddress}`
    )

    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: mockContactId,
      emailAddress: mockContactPayload.emailAddress,
      selectedAlerts: {
        alertA: { scheme1: true, scheme2: true },
        alertB: { scheme3: true }
      }
    })
  })

  test('should return correct view data when contactId is not provided', async () => {
    const mockSanitizedSchemes = [{ id: 2, name: 'SanitizedScheme2' }]
    const mockAlertTypesPayload = ['alertX', 'alertY']
    const mockRequest = {
      auth: {
        credentials: {
          account: {
            username: 'jane.doe'
          }
        }
      },
      query: {}
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(getAlertTypesAndSchemes).toHaveBeenCalled()
    expect(getAlertingData).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith(
      'User jane.doe has accessed the amend alert recipient page for a new user'
    )

    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: undefined,
      emailAddress: undefined,
      selectedAlerts: {
        alertX: {},
        alertY: {}
      }
    })
  })

  test('should fallback to user email if name and username are missing', async () => {
    const mockSanitizedSchemes = []
    const mockAlertTypesPayload = []
    const mockRequest = {
      auth: {
        credentials: {
          account: {
            email: 'email@example.com'
          }
        }
      },
      query: {}
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(console.log).toHaveBeenCalledWith(
      'User email@example.com has accessed the amend alert recipient page for a new user'
    )
    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: undefined,
      emailAddress: undefined,
      selectedAlerts: {}
    })
  })

  test('should handle missing user info gracefully', async () => {
    const mockSanitizedSchemes = []
    const mockAlertTypesPayload = []
    const mockRequest = {
      auth: {
        credentials: {
          account: {}
        }
      },
      query: {}
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(console.log).toHaveBeenCalledWith(
      'User undefined has accessed the amend alert recipient page for a new user'
    )
    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: undefined,
      emailAddress: undefined,
      selectedAlerts: {}
    })
  })

  test('should handle contact payload with missing alert types gracefully', async () => {
    const mockSanitizedSchemes = []
    const mockAlertTypesPayload = ['alert1', 'alert2']
    const mockContactId = 'contact-456'
    const encodedContactId = encodeURIComponent(mockContactId)
    const mockContactPayload = {
      emailAddress: 'user2@example.com'
    }
    const mockRequest = {
      auth: {
        credentials: {
          account: {
            name: 'Alice'
          }
        }
      },
      query: {
        contactId: mockContactId
      }
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    getAlertingData.mockResolvedValue({
      payload: {
        contact: mockContactPayload
      }
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodedContactId}`)
    expect(console.log).toHaveBeenCalledWith(
      `User Alice has accessed the amend alert recipient page for ${mockContactPayload.emailAddress}`
    )

    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: mockContactId,
      emailAddress: mockContactPayload.emailAddress,
      selectedAlerts: {
        alert1: {},
        alert2: {}
      }
    })
  })

  test('should fallback to empty contactPayload if contact property is missing in payload', async () => {
    const mockSanitizedSchemes = []
    const mockAlertTypesPayload = ['alert1']
    const mockContactId = 'contact-missing-contact'
    const encodedContactId = encodeURIComponent(mockContactId)
    const mockRequest = {
      auth: {
        credentials: {
          account: {
            name: 'Bob'
          }
        }
      },
      query: {
        contactId: mockContactId
      }
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    getAlertingData.mockResolvedValue({
      payload: {
      }
    })

    const result = await getAlertUpdateViewData(mockRequest)

    expect(getAlertingData).toHaveBeenCalledWith(`/contact/contactId/${encodedContactId}`)
    expect(console.log).toHaveBeenCalledWith(
      'User Bob has accessed the amend alert recipient page for undefined'
    )

    expect(result).toEqual({
      schemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload,
      contactId: mockContactId,
      emailAddress: undefined,
      selectedAlerts: {
        alert1: {}
      }
    })
  })

  test('should propagate errors from getAlertTypesAndSchemes', async () => {
    const error = new Error('error in getAlertTypesAndSchemes')
    getAlertTypesAndSchemes.mockRejectedValue(error)
    const mockRequest = { auth: { credentials: { account: {} } }, query: {} }

    await expect(getAlertUpdateViewData(mockRequest)).rejects.toThrow('error in getAlertTypesAndSchemes')
  })

  test('should propagate errors from getAlertingData', async () => {
    const mockSanitizedSchemes = []
    const mockAlertTypesPayload = []
    const error = new Error('error in getAlertingData')
    const mockContactId = 'contact-789'
    const mockRequest = {
      auth: { credentials: { account: { username: 'userX' } } },
      query: { contactId: mockContactId }
    }

    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })

    getAlertingData.mockRejectedValue(error)

    await expect(getAlertUpdateViewData(mockRequest)).rejects.toThrow('error in getAlertingData')
  })
})
