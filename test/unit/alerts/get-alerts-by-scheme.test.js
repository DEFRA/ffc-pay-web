jest.mock('../../../app/api', () => ({
  getAlertingData: jest.fn()
}))

const { getAlertingData } = require('../../../app/api')
const { getAlertsByScheme } = require('../../../app/alerts/get-alerts-by-scheme')

describe('getAlertsByScheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns formatted alert types with matching users and scheme name', async () => {
    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list/by-scheme/2') {
        return {
          payload: {
            schemeName: 'Scheme Two',
            contacts: [
              { contactId: 1, batch_rejected: [2], duplicate_record: [2] },
              { contactId: 2, batch_rejected: [3] },
              { contactId: 3, duplicate_record: [2] }
            ]
          }
        }
      }

      if (endpoint === '/alert-types') {
        return { payload: { alertTypes: ['batch_rejected', 'duplicate_record'] } }
      }

      return {}
    })

    const result = await getAlertsByScheme('2')

    expect(getAlertingData).toHaveBeenCalledWith('/contact-list/by-scheme/2')
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(result).toEqual({
      schemeName: 'Scheme Two',
      formattedTypes: [
        {
          type: 'batch_rejected',
          users: [{ contactId: 1, batch_rejected: [2], duplicate_record: [2] }],
          displayType: 'Batch Rejected'
        },
        {
          type: 'duplicate_record',
          users: [
            { contactId: 1, batch_rejected: [2], duplicate_record: [2] },
            { contactId: 3, duplicate_record: [2] }
          ],
          displayType: 'Duplicate Record'
        }
      ]
    })
  })

  test('encodes schemeId in the request path', async () => {
    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list/by-scheme/scheme%2Fwith%20space') {
        return { payload: { contacts: [], schemeName: 'Encoded Scheme' } }
      }

      if (endpoint === '/alert-types') {
        return { payload: { alertTypes: [] } }
      }

      return {}
    })

    const result = await getAlertsByScheme('scheme/with space')

    expect(getAlertingData).toHaveBeenCalledWith('/contact-list/by-scheme/scheme%2Fwith%20space')
    expect(result).toEqual({ formattedTypes: [], schemeName: 'Encoded Scheme' })
  })

  test('handles missing or empty payloads gracefully', async () => {
    getAlertingData
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    const result = await getAlertsByScheme('5')

    expect(result).toEqual({ formattedTypes: [], schemeName: undefined })
  })

  test('ignores user alert values that are not arrays', async () => {
    getAlertingData.mockImplementation(async (endpoint) => {
      if (endpoint === '/contact-list/by-scheme/3') {
        return {
          payload: {
            schemeName: 'Scheme Three',
            contacts: [
              { contactId: 1, batch_rejected: '3' },
              { contactId: 2, batch_rejected: [3] }
            ]
          }
        }
      }

      if (endpoint === '/alert-types') {
        return { payload: { alertTypes: ['batch_rejected'] } }
      }

      return {}
    })

    const result = await getAlertsByScheme('3')

    expect(result).toEqual({
      schemeName: 'Scheme Three',
      formattedTypes: [
        {
          type: 'batch_rejected',
          users: [{ contactId: 2, batch_rejected: [3] }],
          displayType: 'Batch Rejected'
        }
      ]
    })
  })
})
