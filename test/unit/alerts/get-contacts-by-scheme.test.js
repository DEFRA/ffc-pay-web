const config = require('../../../app/config')
const { getAlertingData, getProcessingData } = require('../../../app/api')
const { sanitizeSchemes } = require('../../../app/helpers')
const { getContactsByScheme } = require('../../../app/alerts/get-contacts-by-scheme')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers')

describe('getContactsByScheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => { })
    config.devTeamEmails = ['dev@example.com']
    config.pdsTeamEmails = ['pds@example.com']
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('should return sanitized schemes with alert types and users including canBeEdited flags', async () => {
    const mockUsersPayload = [
      { emailAddress: 'user1@example.com', alertA: ['Scheme1', 'Scheme2'], alertB: ['Scheme2'] },
      { emailAddress: 'dev@example.com', alertA: ['Scheme1'] },
      { emailAddress: 'pds@example.com', alertB: ['Scheme3'] },
      { emailAddress: 'user2@example.com', alertA: ['Scheme1'] }
    ]
    const mockUsersResponse = { payload: { contacts: mockUsersPayload } }

    const mockSchemesPayload = [
      { name: 'Scheme1' },
      { name: 'Scheme2' },
      { name: 'Scheme3' }
    ]
    const mockSanitizedSchemes = [
      { name: 'Scheme1' },
      { name: 'Scheme2' },
      { name: 'Scheme3' }
    ]

    const mockAlertTypesPayload = ['alertA', 'alertB']
    const mockAlertTypesResponse = { payload: { alertTypes: mockAlertTypesPayload } }

    getAlertingData.mockImplementation((endpoint) => {
      if (endpoint === '/contact-list') return Promise.resolve(mockUsersResponse)
      if (endpoint === '/alert-types') return Promise.resolve(mockAlertTypesResponse)
      return Promise.resolve({ payload: {} })
    })
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: mockSchemesPayload } })
    sanitizeSchemes.mockReturnValue(mockSanitizedSchemes)

    const result = await getContactsByScheme()

    expect(getAlertingData).toHaveBeenCalledWith('/contact-list')
    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(sanitizeSchemes).toHaveBeenCalledWith(mockSchemesPayload)

    expect(result).toHaveLength(3)
    const user1 = mockUsersPayload.find(u => u.emailAddress === 'user1@example.com')
    const devUser = mockUsersPayload.find(u => u.emailAddress === 'dev@example.com')
    const pdsUser = mockUsersPayload.find(u => u.emailAddress === 'pds@example.com')
    const user2 = mockUsersPayload.find(u => u.emailAddress === 'user2@example.com')

    expect(user1.canBeEdited).toBe(true)
    expect(devUser.canBeEdited).toBe(false)
    expect(pdsUser.canBeEdited).toBe(false)
    expect(user2.canBeEdited).toBe(true)

    for (const scheme of result) {
      expect(scheme).toHaveProperty('alertTypes')
      expect(scheme.alertTypes).toHaveLength(mockAlertTypesPayload.length)

      for (const alertTypeObj of scheme.alertTypes) {
        expect(alertTypeObj).toHaveProperty('alertType')
        expect(alertTypeObj).toHaveProperty('users')
        expect(Array.isArray(alertTypeObj.users)).toBe(true)
        for (const user of alertTypeObj.users) {
          expect(user[alertTypeObj.alertType]).toContain(scheme.name)
        }
      }
    }

    const scheme1 = result.find(s => s.name === 'Scheme1')
    const alertAUsers = scheme1.alertTypes.find(a => a.alertType === 'alertA').users
    expect(alertAUsers.map(u => u.emailAddress).sort()).toEqual(['user1@example.com', 'dev@example.com', 'user2@example.com'].sort())

    const alertBUsers = scheme1.alertTypes.find(a => a.alertType === 'alertB').users
    expect(alertBUsers).toEqual([])

    expect(console.log).toHaveBeenCalledWith(result)
  })

  test('should handle empty or missing payloads gracefully', async () => {
    getAlertingData.mockImplementation((endpoint) => {
      if (endpoint === '/contact-list') return Promise.resolve({})
      if (endpoint === '/alert-types') return Promise.resolve({})
      return Promise.resolve({})
    })
    getProcessingData.mockResolvedValue({})

    sanitizeSchemes.mockReturnValue([])

    const result = await getContactsByScheme()

    expect(result).toEqual([])
    expect(console.log).toHaveBeenCalledWith([])
  })

  test('should handle users without alert arrays gracefully', async () => {
    const mockUsersPayload = [
      { emailAddress: 'user1@example.com', alertA: null, alertB: 'not-an-array' },
      { emailAddress: 'user2@example.com' }
    ]
    const mockUsersResponse = { payload: { contacts: mockUsersPayload } }

    const mockSchemesPayload = [{ name: 'Scheme1' }]
    const mockSanitizedSchemes = [{ name: 'Scheme1' }]
    const mockAlertTypesPayload = ['alertA', 'alertB']
    const mockAlertTypesResponse = { payload: { alertTypes: mockAlertTypesPayload } }

    getAlertingData.mockImplementation((endpoint) => {
      if (endpoint === '/contact-list') return Promise.resolve(mockUsersResponse)
      if (endpoint === '/alert-types') return Promise.resolve(mockAlertTypesResponse)
      return Promise.resolve({})
    })
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: mockSchemesPayload } })
    sanitizeSchemes.mockReturnValue(mockSanitizedSchemes)

    const result = await getContactsByScheme()

    expect(result).toHaveLength(1)
    const scheme = result[0]
    expect(scheme.alertTypes).toHaveLength(2)
    for (const alertTypeObj of scheme.alertTypes) {
      expect(alertTypeObj.users).toEqual([])
    }
    expect(console.log).toHaveBeenCalledWith(result)
  })

  test('should surface errors from getAlertingData', async () => {
    const error = new Error('alerting data error')
    getAlertingData.mockRejectedValue(error)
    getProcessingData.mockResolvedValue({})

    await expect(getContactsByScheme()).rejects.toThrow('alerting data error')
  })

  test('should surface errors from getProcessingData', async () => {
    const error = new Error('processing data error')
    getAlertingData.mockResolvedValue({ payload: { contacts: [] } })
    getProcessingData.mockRejectedValue(error)

    await expect(getContactsByScheme()).rejects.toThrow('processing data error')
  })
})
