jest.mock('../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

jest.mock('../../../app/alerts/get-alert-types-and-schemes', () => ({
  getAlertTypesAndSchemes: jest.fn()
}))

const { getAlertingData } = require('../../../app/api')
const { getAlertTypesAndSchemes } = require('../../../app/alerts/get-alert-types-and-schemes')
const {
  getAlertRecipientViewData,
  normaliseValues
} = require('../../../app/alerts/get-alert-recipient-view-data')

describe('get-alert-recipient-view-data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('normaliseValues', () => {
    test('returns empty array for undefined values', () => {
      expect(normaliseValues(undefined)).toEqual([])
      expect(normaliseValues(null)).toEqual([])
      expect(normaliseValues('')).toEqual([])
    })

    test('returns array of values for single string', () => {
      expect(normaliseValues('EMAIL')).toEqual(['EMAIL'])
    })

    test('filters out falsey values from arrays', () => {
      expect(normaliseValues(['EMAIL', '', null, 'SMS'])).toEqual(['EMAIL', 'SMS'])
    })
  })

  test('returns base data without loading contact when loadContact is false', async () => {
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [{ schemeId: 1, name: 'Scheme One' }],
      alertTypesPayload: ['EMAIL']
    })

    const request = {
      auth: { credentials: { account: { name: 'Jane Doe' } } },
      query: {},
      payload: {}
    }

    const result = await getAlertRecipientViewData(request)

    expect(getAlertTypesAndSchemes).toHaveBeenCalled()
    expect(getAlertingData).not.toHaveBeenCalled()
    expect(result).toEqual({
      schemesPayload: [{ schemeId: 1, name: 'Scheme One' }],
      alertTypesPayload: ['EMAIL'],
      selectedAlerts: { EMAIL: {} },
      contactId: undefined,
      emailAddress: undefined,
      schemeId: undefined,
      action: undefined
    })
  })

  test('loads contact when loadContact is true and contactId exists', async () => {
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [{ schemeId: 1, name: 'Scheme One' }],
      alertTypesPayload: ['EMAIL', 'SMS']
    })
    getAlertingData.mockResolvedValue({
      payload: {
        contact: {
          contactId: 'contact-1',
          emailAddress: 'user@example.com',
          EMAIL: ['1'],
          SMS: []
        }
      }
    })

    const request = {
      auth: { credentials: { account: { username: 'jdoe' } } },
      query: { contactId: 'contact-1', loadContact: 'true' }
    }

    const result = await getAlertRecipientViewData(request, { loadContact: true })

    expect(getAlertingData).toHaveBeenCalledWith('/contact/contact-1')
    expect(result).toEqual({
      schemesPayload: [{ schemeId: 1, name: 'Scheme One' }],
      alertTypesPayload: ['EMAIL', 'SMS'],
      selectedAlerts: {
        EMAIL: { 1: true },
        SMS: {}
      },
      contactId: 'contact-1',
      emailAddress: 'user@example.com',
      schemeId: undefined,
      action: undefined
    })
  })

  test('uses payload when query values are missing', async () => {
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [{ schemeId: 2, name: 'Scheme Two' }],
      alertTypesPayload: ['EMAIL']
    })

    const request = {
      auth: { credentials: { account: { email: 'user@example.com' } } },
      query: {},
      payload: { schemeId: 2, action: 'edit', 2: 'EMAIL' }
    }

    const result = await getAlertRecipientViewData(request)

    expect(result.schemeId).toBe(2)
    expect(result.action).toBe('edit')
    expect(result.selectedAlerts).toEqual({
      EMAIL: { 2: true }
    })
  })

  test('filters schemesPayload when schemeId is provided', async () => {
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [
        { schemeId: 1, name: 'Scheme One' },
        { schemeId: 2, name: 'Scheme Two' }
      ],
      alertTypesPayload: ['EMAIL']
    })

    const request = {
      auth: { credentials: { account: { name: 'Sam' } } },
      query: { schemeId: '2', 2: 'EMAIL' }
    }

    const result = await getAlertRecipientViewData(request)

    expect(result.schemesPayload).toEqual([{ schemeId: 2, name: 'Scheme Two' }])
    expect(result.selectedAlerts).toEqual({
      EMAIL: { 2: true }
    })
  })

  test('merges contact payload alert selections with query/payload selections', async () => {
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [
        { schemeId: 1, name: 'Scheme A' },
        { schemeId: 2, name: 'Scheme B' }
      ],
      alertTypesPayload: ['EMAIL']
    })
    getAlertingData.mockResolvedValue({
      payload: {
        contact: {
          emailAddress: 'user@example.com',
          EMAIL: ['1']
        }
      }
    })

    const request = {
      auth: { credentials: { account: { name: 'Sam' } } },
      query: { contactId: 'contact-1', schemeId: '2', 2: 'EMAIL' }
    }

    const result = await getAlertRecipientViewData(request, { loadContact: true })

    expect(result.selectedAlerts).toEqual({
      EMAIL: { 1: true, 2: true }
    })
  })

  test('propagates errors from getAlertTypesAndSchemes', async () => {
    const error = new Error('failed schemes')
    getAlertTypesAndSchemes.mockRejectedValue(error)

    const request = {
      auth: { credentials: { account: { name: 'Sam' } } },
      query: {}
    }

    await expect(getAlertRecipientViewData(request)).rejects.toThrow('failed schemes')
  })

  test('propagates errors from getAlertingData when loading contact', async () => {
    const error = new Error('failed contact')
    getAlertTypesAndSchemes.mockResolvedValue({
      sanitizedSchemesPayload: [],
      alertTypesPayload: []
    })
    getAlertingData.mockRejectedValue(error)

    const request = {
      auth: { credentials: { account: { name: 'Sam' } } },
      query: { contactId: 'contact-2' }
    }

    await expect(getAlertRecipientViewData(request, { loadContact: true })).rejects.toThrow(
      'failed contact'
    )
  })
})
