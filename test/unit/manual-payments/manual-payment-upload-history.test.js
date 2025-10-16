const { manualPaymentUploadHistory } = require('../../../app/manual-payments/manual-payment-upload-history')
const { getHistoricalInjectionData } = require('../../../app/api')
const { formatDateTimeFromString } = require('../../../app/helpers/date-time-formatter')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers/date-time-formatter')
jest.mock('../../../app/constants/injection-routes', () => ({
  MANUAL_UPLOAD_AUDIT: 'manual-upload-audit'
}))

describe('manualPaymentUploadHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns formatted uploads when API call succeeds', async () => {
    const mockUploads = [
      { id: 1, timeStamp: '2025-10-15T10:00:00Z' },
      { id: 2, timeStamp: '2025-10-16T11:30:00Z' }
    ]

    getHistoricalInjectionData.mockResolvedValue({ payload: mockUploads })
    formatDateTimeFromString
      .mockImplementation(ts => `formatted-${ts}`)

    const result = await manualPaymentUploadHistory()

    expect(getHistoricalInjectionData).toHaveBeenCalledWith('manual-upload-audit', 60)
    expect(formatDateTimeFromString).toHaveBeenCalledTimes(2)
    expect(result).toEqual([
      { id: 1, timeStamp: 'formatted-2025-10-15T10:00:00Z' },
      { id: 2, timeStamp: 'formatted-2025-10-16T11:30:00Z' }
    ])
  })

  test('returns an empty array when payload is missing', async () => {
    getHistoricalInjectionData.mockResolvedValue({})
    const result = await manualPaymentUploadHistory()

    expect(getHistoricalInjectionData).toHaveBeenCalledWith('manual-upload-audit', 60)
    expect(result).toEqual([])
  })

  test('returns an empty array and logs an error when API call fails', async () => {
    const mockError = new Error('Network failure')
    getHistoricalInjectionData.mockRejectedValue(mockError)

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await manualPaymentUploadHistory()

    expect(result).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch upload history:',
      mockError
    )

    consoleErrorSpy.mockRestore()
  })
})
