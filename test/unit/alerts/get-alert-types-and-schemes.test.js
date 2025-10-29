const { getAlertTypesAndSchemes } = require('../../../app/alerts')
const { getProcessingData, getAlertingData } = require('../../../app/api')
const { sanitizeSchemes } = require('../../../app/helpers')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers')

describe('getAlertTypesAndSchemes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return sanitized schemes and alert types from the API responses', async () => {
    const mockSchemesPayload = [{ id: 1, name: 'Scheme1' }]
    const mockSanitizedSchemes = [{ id: 1, name: 'SanitizedScheme1' }]
    const mockAlertTypesPayload = [{ id: 10, type: 'AlertType1' }]

    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: mockSchemesPayload } })
    sanitizeSchemes.mockReturnValue(mockSanitizedSchemes)
    getAlertingData.mockResolvedValue({ payload: { alertTypes: mockAlertTypesPayload } })

    const result = await getAlertTypesAndSchemes()

    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
    expect(sanitizeSchemes).toHaveBeenCalledWith(mockSchemesPayload)
    expect(getAlertingData).toHaveBeenCalledWith('/alert-types')
    expect(result).toEqual({
      sanitizedSchemesPayload: mockSanitizedSchemes,
      alertTypesPayload: mockAlertTypesPayload
    })
  })

  test('should handle missing paymentSchemes and alertTypes gracefully', async () => {
    getProcessingData.mockResolvedValue({ payload: {} })
    sanitizeSchemes.mockReturnValue([])
    getAlertingData.mockResolvedValue({ payload: {} })

    const result = await getAlertTypesAndSchemes()

    expect(sanitizeSchemes).toHaveBeenCalledWith([])
    expect(result).toEqual({
      sanitizedSchemesPayload: [],
      alertTypesPayload: []
    })
  })

  test('should handle null or undefined API responses', async () => {
    getProcessingData.mockResolvedValue(null)
    sanitizeSchemes.mockReturnValue([])
    getAlertingData.mockResolvedValue(undefined)

    const result = await getAlertTypesAndSchemes()

    expect(sanitizeSchemes).toHaveBeenCalledWith([])
    expect(result).toEqual({
      sanitizedSchemesPayload: [],
      alertTypesPayload: []
    })
  })

  test('should propagate errors from getProcessingData', async () => {
    const error = new Error('processing error')
    getProcessingData.mockRejectedValue(error)

    await expect(getAlertTypesAndSchemes()).rejects.toThrow('processing error')
  })

  test('should propagate errors from getAlertingData', async () => {
    getProcessingData.mockResolvedValue({ payload: { paymentSchemes: [] } })
    sanitizeSchemes.mockReturnValue([])
    const error = new Error('alerting error')
    getAlertingData.mockRejectedValue(error)

    await expect(getAlertTypesAndSchemes()).rejects.toThrow('alerting error')
  })
})
