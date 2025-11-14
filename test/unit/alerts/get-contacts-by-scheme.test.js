const { getContactsByScheme } = require('../../../app/alerts/get-contacts-by-scheme')
const { getAlertingData, getProcessingData } = require('../../../app/api')
const { sanitizeSchemes } = require('../../../app/helpers')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers')

describe('getContactsByScheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return schemes with alertTypes and matching users', async () => {
    const usersPayload = [
      { type1: ['schemeA'], type2: ['schemeB'] },
      { type1: ['schemeB'], type3: ['schemeA'] },
      { type2: ['schemeA'] }
    ]
    const schemesPayload = [
      { name: 'schemeA', otherProp: true },
      { name: 'schemeB', otherProp: false }
    ]
    const sanitizedSchemes = [
      { name: 'schemeA', otherProp: true },
      { name: 'schemeB', otherProp: false }
    ]
    const alertTypesPayload = ['type1', 'type2', 'type3']

    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list') {
        return { payload: { contacts: usersPayload } }
      }
      if (endpoint === '/alert-types') {
        return { payload: { alertTypes: alertTypesPayload } }
      }
      return {}
    })

    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: schemesPayload } })
    sanitizeSchemes.mockReturnValue(sanitizedSchemes)

    const result = await getContactsByScheme()

    expect(getAlertingData).toHaveBeenCalledWith('/contact-list')
    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(sanitizeSchemes).toHaveBeenCalledWith(schemesPayload)

    expect(result).toHaveLength(sanitizedSchemes.length)
    for (const scheme of result) {
      expect(scheme).toHaveProperty('alertTypes')
      expect(Array.isArray(scheme.alertTypes)).toBe(true)
      for (const alertTypeEntry of scheme.alertTypes) {
        expect(alertTypeEntry).toHaveProperty('alertType')
        expect(alertTypeEntry).toHaveProperty('users')
        expect(Array.isArray(alertTypeEntry.users)).toBe(true)
        for (const user of alertTypeEntry.users) {
          expect(user).toBeDefined()
        }
      }
    }

    const schemeA = result.find(s => s.name === 'schemeA')
    const schemeB = result.find(s => s.name === 'schemeB')

    expect(schemeA.alertTypes.find(a => a.alertType === 'type1').users).toEqual([
      { type1: ['schemeA'], type2: ['schemeB'] }
    ])
    expect(schemeA.alertTypes.find(a => a.alertType === 'type2').users).toEqual([
      { type2: ['schemeA'] }
    ])
    expect(schemeA.alertTypes.find(a => a.alertType === 'type3').users).toEqual([
      { type1: ['schemeB'], type3: ['schemeA'] }
    ])

    expect(schemeB.alertTypes.find(a => a.alertType === 'type1').users).toEqual([
      { type1: ['schemeB'], type3: ['schemeA'] }
    ])
    expect(schemeB.alertTypes.find(a => a.alertType === 'type2').users).toEqual([
      { type1: ['schemeA'], type2: ['schemeB'] }
    ])
    expect(schemeB.alertTypes.find(a => a.alertType === 'type3').users).toEqual([])
  })

  test('should handle empty or missing payloads gracefully', async () => {
    getAlertingData.mockResolvedValueOnce({ payload: {} })
    getProcessingData.mockResolvedValueOnce({ payload: {} })
    getAlertingData.mockResolvedValueOnce({ payload: {} })
    sanitizeSchemes.mockReturnValue([])

    const result = await getContactsByScheme()

    expect(result).toEqual([])
  })

  test('should handle users with missing alert types gracefully', async () => {
    const usersPayload = [
      { someOtherKey: ['schemeA'] },
      { type1: ['schemeB'] }
    ]
    const schemesPayload = [{ name: 'schemeA' }, { name: 'schemeB' }]
    const sanitizedSchemes = [{ name: 'schemeA' }, { name: 'schemeB' }]
    const alertTypesPayload = ['type1']

    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list') {
        return { payload: { contacts: usersPayload } }
      }
      if (endpoint === '/alert-types') {
        return { payload: { alertTypes: alertTypesPayload } }
      }
      return {}
    })

    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: schemesPayload } })
    sanitizeSchemes.mockReturnValue(sanitizedSchemes)

    const result = await getContactsByScheme()

    expect(result).toHaveLength(2)
    expect(result[0].alertTypes[0].users).toEqual([])
    expect(result[1].alertTypes[0].users).toEqual([
      { type1: ['schemeB'] }
    ])
  })
})
