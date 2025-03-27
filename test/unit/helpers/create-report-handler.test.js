const { buildQueryUrl } = require('../../../app/helpers/build-query-url')
const { fetchDataAndRespond } = require('../../../app/helpers/fetch-data-and-respond')
const api = require('../../../app/api')
const { mapReportData } = require('../../../app/helpers/map-report-data')
const { createReportHandler } = require('../../../app/helpers')
const { sanitizeData } = require('../../../app/helpers/sanitize-data')

jest.mock('../../../app/helpers/build-query-url')
jest.mock('../../../app/helpers/fetch-data-and-respond')
jest.mock('../../../app/helpers/sanitize-data')
jest.mock('../../../app/api')
jest.mock('../../../app/helpers/map-report-data')

describe('create report handler', () => {
  const mockResponse = {
    payload: {
      reportData: [
        { id: 1, value: 'test' }
      ]
    }
  }

  const path = '/test-path'
  const fields = { id: 'id', value: 'value' }
  const filenameFunc = jest.fn().mockReturnValue('test-filename.csv')
  const errorView = 'error-view'

  let request
  let h

  beforeEach(() => {
    request = {
      query: {
        schemeId: '123',
        year: '2024',
        prn: 1,
        revenueOrCapital: 'revenue',
        frn: '456'
      }
    }
    h = {
      view: jest.fn().mockReturnThis(),
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis()
    }

    jest.clearAllMocks()

    buildQueryUrl.mockReturnValue('http://example.com/test-url')
    sanitizeData.mockImplementation(data => data)
    fetchDataAndRespond.mockImplementation((fetchFn, mapFn, filename, h, errorView) => {
      return fetchFn().then(response => {
        const mappedData = mapFn(response)
        return h.response(mappedData).code(200)
      }).catch(() => h.view(errorView).code(500))
    })

    api.getTrackingData.mockResolvedValue(mockResponse)
    mapReportData.mockImplementation((data, fields) => {
      const mapped = {}
      for (const [key, path] of Object.entries(fields)) {
        mapped[key] = data[path]
      }
      return mapped
    })
  })

  test('should build the correct URL', async () => {
    const handler = createReportHandler(path, fields, filenameFunc, errorView)
    await handler(request, h)

    expect(buildQueryUrl).toHaveBeenCalledWith(path, '123', '2024', 1, '456', 'revenue')
  })

  test('should call fetchDataAndRespond with correct arguments', async () => {
    const handler = createReportHandler(path, fields, filenameFunc, errorView)
    await handler(request, h)

    expect(fetchDataAndRespond).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'test-filename.csv',
      h,
      errorView
    )
  })

  test('should map the data correctly', async () => {
    const handler = createReportHandler(path, fields, filenameFunc, errorView)
    await handler(request, h)

    expect(mapReportData).toHaveBeenCalledWith({ id: 1, value: 'test' }, fields)
    expect(h.response).toHaveBeenCalledWith([{ id: 1, value: 'test' }])
  })

  test('should handle errors by returning the correct view', async () => {
    api.getTrackingData.mockRejectedValue(new Error('API error'))
    const handler = createReportHandler(path, fields, filenameFunc, errorView)
    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith(errorView)
    expect(h.view).toHaveBeenCalledTimes(1)
  })
})
