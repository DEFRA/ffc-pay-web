const { queryTrackingApi } = require('../../../app/helpers/query-tracking-api')
jest.mock('../../../app/api', () => ({
  getTrackingData: jest.fn()
}))
const api = require('../../../app/api')

describe('queryTrackingApi', () => {
  let debugSpy

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should return file from response payload and log debug messages', async () => {
    const url = 'http://example.com'
    const fakeFile = 'report.csv'
    const fakeResponse = { payload: { file: fakeFile } }
    api.getTrackingData.mockResolvedValue(fakeResponse)
    const result = await queryTrackingApi(url)
    expect(debugSpy).toHaveBeenNthCalledWith(1, `Downloading report data from ${url}`)
    expect(api.getTrackingData).toHaveBeenCalledWith(url)
    expect(debugSpy).toHaveBeenNthCalledWith(2, 'Tracking response received', fakeResponse.payload)
    expect(result).toBe(fakeFile)
  })

  test('should propagate error if api.getTrackingData rejects', async () => {
    const url = 'http://fail.com'
    const error = new Error('Request failed')
    api.getTrackingData.mockRejectedValue(error)
    await expect(queryTrackingApi(url)).rejects.toThrow(error)
    expect(debugSpy).toHaveBeenCalledWith(`Downloading report data from ${url}`)
  })
})
