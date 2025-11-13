const { paymentsEndpoint, injectionEndpoint, trackingEndpoint, alertingEndpoint } = require('../../app/config')
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

    expect(wreck.get).toHaveBeenCalledWith(`${paymentsEndpoint}url`, {
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock)
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('postProcessing makes request with auth header and returns payload only', async ({ token, expectedAuthVal }) => {
    const wreckResponseMock = { res: { statusCode: 200 }, payload: { message: 'something' } }
    wreck.post.mockResolvedValueOnce(wreckResponseMock)
    const data = { hi: 'world' }

    const response = await api.postProcessing('url', data, token)

    expect(wreck.post).toHaveBeenCalledWith(`${paymentsEndpoint}url`, {
      payload: data,
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(wreckResponseMock.payload)
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('postInjection makes request with auth header and returns { statusCode, payload }', async ({ token, expectedAuthVal }) => {
    const wreckResponseMock = { res: { statusCode: 200 }, payload: { success: true } }
    wreck.post.mockResolvedValueOnce(wreckResponseMock)
    const data = { uploader: 'user', filename: 'file.txt' }

    const response = await api.postInjection('injection-url', data, token)

    expect(wreck.post).toHaveBeenCalledWith(`${injectionEndpoint}injection-url`, {
      payload: data,
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual({ statusCode: 200, payload: wreckResponseMock.payload })
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('postAlerting makes request with auth header and returns { statusCode, payload }', async ({ token, expectedAuthVal }) => {
    const wreckResponseMock = { res: { statusCode: 201 }, payload: { alert: 'sent' } }
    wreck.post.mockResolvedValueOnce(wreckResponseMock)
    const data = { alertType: 'email', message: 'Hello' }

    const response = await api.postAlerting('alert-url', data, token)

    expect(wreck.post).toHaveBeenCalledWith(`${alertingEndpoint}alert-url`, {
      payload: data,
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual({ statusCode: 201, payload: wreckResponseMock.payload })
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('getTrackingData makes request with auth header and returns response', async ({ token, expectedAuthVal }) => {
    const url = 'tracking-url'
    const responseMock = { payload: 'tracking data' }
    wreck.get.mockResolvedValueOnce(responseMock)

    const response = await api.getTrackingData(url, token)

    expect(wreck.get).toHaveBeenCalledWith(`${trackingEndpoint}${url}`, {
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock)
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('getAlertingData makes request with auth header and returns response', async ({ token, expectedAuthVal }) => {
    const url = 'alerting-url'
    const responseMock = { payload: 'alert data' }
    wreck.get.mockResolvedValueOnce(responseMock)

    const response = await api.getAlertingData(url, token)

    expect(wreck.get).toHaveBeenCalledWith(`${alertingEndpoint}${url}`, {
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock)
  })
})

describe('getInjectionData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    { token: 'token', expectedAuthVal: 'token' },
    { token: null, expectedAuthVal: '' },
    { token: undefined, expectedAuthVal: '' }
  ])('makes GET request with proper auth header', async ({ token, expectedAuthVal }) => {
    const responseMock = { payload: 'data' }
    wreck.get.mockResolvedValueOnce(responseMock)

    const url = '/injection-data'
    const response = await api.getInjectionData(url, token)

    expect(wreck.get).toHaveBeenCalledWith(`${injectionEndpoint}${url}`, {
      headers: { Authorization: expectedAuthVal },
      json: true
    })
    expect(response).toEqual(responseMock)
  })
})

describe('getHistoricalInjectionData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2025-10-16T00:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('constructs endpoint with correct date range and delegates to getInjectionData', async () => {
    wreck.get.mockResolvedValueOnce('mock-response')

    const token = 'test-token'
    const endpoint = '/manual-upload-audit'
    const daysBack = 7

    const today = '2025-10-16'
    const from = '2025-10-09'
    const expectedUrl = `${endpoint}?from=${from}&to=${today}`

    const response = await api.getHistoricalInjectionData(endpoint, daysBack, token)

    expect(wreck.get).toHaveBeenCalledWith(`${injectionEndpoint}${expectedUrl}`, {
      headers: { Authorization: token },
      json: true
    })
    expect(response).toBe('mock-response')
  })

  test('works correctly with daysBack = 0 (from and to are the same)', async () => {
    wreck.get.mockResolvedValueOnce('mock-response')

    const token = 'token'
    const endpoint = '/endpoint'
    const daysBack = 0

    const today = '2025-10-16'
    const expectedUrl = `${endpoint}?from=${today}&to=${today}`

    const response = await api.getHistoricalInjectionData(endpoint, daysBack, token)

    expect(wreck.get).toHaveBeenCalledWith(`${injectionEndpoint}${expectedUrl}`, {
      headers: { Authorization: token },
      json: true
    })
    expect(response).toBe('mock-response')
  })
})
