const { handleStreamResponse } = require('../../../app/helpers/handle-stream-response')
const { readableStreamReturn } = require('../../../app/helpers/readable-stream-return')

jest.mock('../../../app/helpers/readable-stream-return')

describe('handleStreamResponse', () => {
  let h

  beforeEach(() => {
    h = {
      view: jest.fn().mockReturnValue('mock-view-response')
    }
    jest.clearAllMocks()
  })

  test('returns readable stream response when report is available', async () => {
    const mockStreamResponse = { readableStreamBody: 'mock-stream' }
    const getReport = jest.fn().mockResolvedValue(mockStreamResponse)
    readableStreamReturn.mockReturnValue('mock-stream-response')

    const result = await handleStreamResponse(getReport, 'mock-report-name.csv', h)

    expect(getReport).toHaveBeenCalled()
    expect(readableStreamReturn).toHaveBeenCalledWith(mockStreamResponse, h, 'mock-report-name.csv')
    expect(result).toBe('mock-stream-response')
  })

  test('returns unavailable view when report is null', async () => {
    const getReport = jest.fn().mockResolvedValue(null)

    const result = await handleStreamResponse(getReport, 'mock-report-name.csv', h)

    expect(getReport).toHaveBeenCalled()
    expect(readableStreamReturn).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('payment-report-unavailable')
    expect(result).toBe('mock-view-response')
  })

  test('returns unavailable view when getReport throws an error', async () => {
    const getReport = jest.fn().mockRejectedValue(new Error('Test error'))

    const result = await handleStreamResponse(getReport, 'mock-report-name.csv', h)

    expect(getReport).toHaveBeenCalled()
    expect(readableStreamReturn).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('payment-report-unavailable')
    expect(result).toBe('mock-view-response')
  })
})
