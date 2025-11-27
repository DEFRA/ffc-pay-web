const { getManualPaymentUploadHistory } = require('../../../app/manual-payments/get-manual-payment-upload-history')
const { getHistoricalInjectionData } = require('../../../app/api')
const { formatDateTimeFromString } = require('../../../app/helpers/date-time-formatter')

jest.mock('../../../app/api')
jest.mock('../../../app/helpers/date-time-formatter')
jest.mock('../../../app/constants/injection-routes', () => ({
  MANUAL_UPLOAD_AUDIT: 'manual-upload-audit'
}))

describe('getManualPaymentUploadHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns formatted uploads when API call succeeds', async () => {
    const mockUploads = [
      { id: 1, timeStamp: '2025-10-15T10:00:00Z' },
      { id: 2, timeStamp: '2025-10-16T11:30:00Z' }
    ]
    getHistoricalInjectionData.mockResolvedValue({ payload: mockUploads })
    formatDateTimeFromString.mockImplementation(ts => `formatted-${ts}`)

    const result = await getManualPaymentUploadHistory()

    expect(getHistoricalInjectionData).toHaveBeenCalledWith('manual-upload-audit', 60)
    expect(formatDateTimeFromString).toHaveBeenCalledTimes(mockUploads.length)
    expect(result).toEqual(mockUploads.map(u => ({ id: u.id, timeStamp: `formatted-${u.timeStamp}` })))
  })

  test('returns empty array when payload is missing', async () => {
    getHistoricalInjectionData.mockResolvedValue({})
    const result = await getManualPaymentUploadHistory()
    expect(result).toEqual([])
  })

  test('returns empty array and logs error on API failure', async () => {
    const mockError = new Error('Network failure')
    getHistoricalInjectionData.mockRejectedValue(mockError)

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await getManualPaymentUploadHistory()

    expect(result).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch upload history:', mockError)

    consoleErrorSpy.mockRestore()
  })
})
