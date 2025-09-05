const { paymentsEndpoint, injectionEndpoint, trackingEndpoint } = require('../../app/config')
const api = require('../../app/api')
const wreck = require('@hapi/wreck')

jest.mock('@hapi/wreck')

describe('API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('getProcessingData makes request with auth header and returns response', async ({ token, expectedAuthVal }) => {
    const responseMock = { payload: 'something' }
    wreck.get.mockResolvedValueOnce(responseMock)

    const response = await api.getProcessingData('url', token)

    expect(wreck.get).toHaveBeenCalledTimes(1)
    expect(wreck.get).toHaveBeenCalledWith(`${paymentsEndpoint}url`, { headers: { Authorization: expectedAuthVal }, json: true })
    expect(response).toEqual(responseMock)
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('postProcessing makes request with auth header and returns payload', async ({ token, expectedAuthVal }) => {
    const responseMock = { payload: 'something' }
    wreck.post.mockResolvedValueOnce(responseMock)
    const data = { hi: 'world' }

    const response = await api.postProcessing('url', data, token)

    expect(wreck.post).toHaveBeenCalledTimes(1)
    expect(wreck.post).toHaveBeenCalledWith(`${paymentsEndpoint}url`, {
      payload: data,
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock.payload)
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('postInjection makes request with auth header and returns payload', async ({ token, expectedAuthVal }) => {
    const responseMock = { payload: { success: true } }
    wreck.post.mockResolvedValueOnce(responseMock)
    const data = { uploader: 'user', filename: 'file.txt' }

    const response = await api.postInjection('injection-url', data, token)

    expect(wreck.post).toHaveBeenCalledTimes(1)
    expect(wreck.post).toHaveBeenCalledWith(`${injectionEndpoint}injection-url`, {
      payload: data,
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock.payload)
  })

  test('getTrackingData makes request with auth header and returns response', async () => {
    const token = 'token'
    const url = 'tracking-url'
    const responseMock = { payload: 'tracking data' }
    wreck.get.mockResolvedValueOnce(responseMock)

    const response = await api.getTrackingData(url, token)

    expect(wreck.get).toHaveBeenCalledTimes(1)
    expect(wreck.get).toHaveBeenCalledWith(`${trackingEndpoint}${url}`, { headers: { Authorization: token }, json: true })
    expect(response).toEqual(responseMock)
  })
})
