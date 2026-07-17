const { sendRequestsLog } = require('../../../app/statement-downloader/search-helpers/send-requests-log')
const api = require('../../../app/api')

jest.mock('../../../app/api', () => ({
  postStatementPublisher: jest.fn()
}))

describe('send-requests-log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should log the payload and post it to the statement publisher', async () => {
    const entry = {
      username: 'test-user',
      filename: 'statement.pdf',
      type: 'Search',
      timestamp: '2026-07-06T00:00:00.000Z'
    }
    const mockResponse = { statusCode: 200 }
    api.postStatementPublisher.mockResolvedValue(mockResponse)
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()

    const result = await sendRequestsLog(entry)

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[Requests] Sending POST /requests with payload:',
      entry
    )
    expect(api.postStatementPublisher).toHaveBeenCalledWith('/requests', entry, null)
    expect(result).toEqual(mockResponse)

    consoleInfoSpy.mockRestore()
  })

  test('should resolve the value returned by the API client', async () => {
    const entry = { username: 'another-user', filename: 'another.pdf', type: 'Download' }
    const mockResponse = { statusCode: 201, payload: { ok: true } }
    api.postStatementPublisher.mockResolvedValue(mockResponse)

    const result = await sendRequestsLog(entry)

    expect(result).toEqual(mockResponse)
  })

  test('should propagate errors from the API client', async () => {
    const entry = { username: 'error-user', filename: 'bad.pdf', type: 'Search' }
    const error = new Error('request logging failed')
    api.postStatementPublisher.mockRejectedValue(error)

    await expect(sendRequestsLog(entry)).rejects.toThrow('request logging failed')
  })
})
