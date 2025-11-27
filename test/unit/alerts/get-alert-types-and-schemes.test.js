const { getAlertTypesAndSchemes } = require('../../../app/alerts')
const { getProcessingData, getAlertingData } = require('../../../app/api')
const { sanitizeSchemes } = require('../../../app/helpers')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers')

describe('getAlertTypesAndSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns sanitized schemes and alert types from API responses', async () => {
    const mockSchemes = [{ id: 1, name: 'Scheme1' }]
    const mockSanitizedSchemes = [{ id: 1, name: 'SanitizedScheme1' }]
    const mockAlertTypes = [{ id: 10, type: 'AlertType1' }]

    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: mockSchemes } })
    sanitizeSchemes.mockReturnValue(mockSanitizedSchemes)
    getAlertingData.mockResolvedValue({ payload: { alertTypes: mockAlertTypes } })

    const result = await getAlertTypesAndSchemes()

    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
    expect(sanitizeSchemes).toHaveBeenCalledWith(mockSchemes)
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(result).toEqual({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypes
    })
  })

  test.each([
    [{}, [], {}],
    [null, [], undefined]
  ])(
    'handles missing or null API responses gracefully: %p',
    async (processingPayload, sanitizedReturn, alertingPayload) => {
      getProcessingData.mockResolvedValue(processingPayload)
      sanitizeSchemes.mockReturnValue(sanitizedReturn)
      getAlertingData.mockResolvedValue(alertingPayload)

      const result = await getAlertTypesAndSchemes()

      expect(sanitizeSchemes).toHaveBeenCalledWith(sanitizedReturn === [] ? [] : [])
      expect(result).toEqual({
        sanitizedSchemesPayload: [],
        alertTypesPayload: []
      })
    }
  )

  test('propagates errors from getProcessingData', async () => {
    const error = new Error('processing error')
    getProcessingData.mockRejectedValue(error)
    await expect(getAlertTypesAndSchemes()).rejects.toThrow('processing error')
  })

  test('propagates errors from getAlertingData', async () => {
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: [] } })
    sanitizeSchemes.mockReturnValue([])
    const error = new Error('alerting error')
    getAlertingData.mockRejectedValue(error)
    await expect(getAlertTypesAndSchemes()).rejects.toThrow('alerting error')
  })
})
