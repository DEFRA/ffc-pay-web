const { getContactsByScheme } = require('../../../app/alerts/get-contacts-by-scheme')
const { getAlertingData, getProcessingData } = require('../../../app/api')
const { sanitizeSchemes } = require('../../../app/helpers')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers')

describe('getContactsByScheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns schemes with alertTypes and matching users', async () => {
    const users = [
      { type1: ['schemeA'], type2: ['schemeB'] },
      { type1: ['schemeB'], type3: ['schemeA'] },
      { type2: ['schemeA'] }
    ]
    const schemes = [
      { name: 'schemeA', otherProp: true },
      { name: 'schemeB', otherProp: false }
    ]
    const sanitizedSchemes = [...schemes]
    const alertTypes = ['type1', 'type2', 'type3']

    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list') {
        return { payload: { contacts: users } }
      } else if (endpoint === '/alert-types') {
        return { payload: { alertTypes } }
      } else {
        return {}
      }
    })
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: schemes } })
    sanitizeSchemes.mockReturnValue(sanitizedSchemes)

    const result = await getContactsByScheme()

    expect(getAlertingData).toHaveBeenCalledWith('/contact-list')
    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(sanitizeSchemes).toHaveBeenCalledWith(schemes)

    expect(result).toHaveLength(sanitizedSchemes.length)
    for (const scheme of result) {
      expect(scheme).toHaveProperty('alertTypes')
      scheme.alertTypes.forEach(a => {
        expect(a).toHaveProperty('alertType')
        expect(a).toHaveProperty('users')
        expect(Array.isArray(a.users)).toBe(true)
      })
    }

    const schemeA = result.find(s => s.name === 'schemeA')
    const schemeB = result.find(s => s.name === 'schemeB')

    expect(schemeA.alertTypes.find(a => a.alertType === 'type1').users).toEqual([{ type1: ['schemeA'], type2: ['schemeB'] }])
    expect(schemeA.alertTypes.find(a => a.alertType === 'type2').users).toEqual([{ type2: ['schemeA'] }])
    expect(schemeA.alertTypes.find(a => a.alertType === 'type3').users).toEqual([{ type1: ['schemeB'], type3: ['schemeA'] }])

    expect(schemeB.alertTypes.find(a => a.alertType === 'type1').users).toEqual([{ type1: ['schemeB'], type3: ['schemeA'] }])
    expect(schemeB.alertTypes.find(a => a.alertType === 'type2').users).toEqual([{ type1: ['schemeA'], type2: ['schemeB'] }])
    expect(schemeB.alertTypes.find(a => a.alertType === 'type3').users).toEqual([])
  })

  test('handles empty or missing payloads gracefully', async () => {
    getAlertingData.mockResolvedValueOnce({ payload: {} })
    getProcessingData.mockResolvedValueOnce({ payload: {} })
    getAlertingData.mockResolvedValueOnce({ payload: {} })
    sanitizeSchemes.mockReturnValue([])

    const result = await getContactsByScheme()
    expect(result).toEqual([])
  })

  test('handles users with missing alert types gracefully', async () => {
    const users = [{ someOtherKey: ['schemeA'] }, { type1: ['schemeB'] }]
    const schemes = [{ name: 'schemeA' }, { name: 'schemeB' }]
    const sanitizedSchemes = [...schemes]
    const alertTypes = ['type1']

    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list') {
        return { payload: { contacts: users } }
      } else if (endpoint === '/alert-types') {
        return { payload: { alertTypes } }
      } else {
        return {}
      }
    })
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: schemes } })
    sanitizeSchemes.mockReturnValue(sanitizedSchemes)

    const result = await getContactsByScheme()

    expect(result).toHaveLength(2)
    expect(result[0].alertTypes[0].users).toEqual([])
    expect(result[1].alertTypes[0].users).toEqual([{ type1: ['schemeB'] }])
  })
})
