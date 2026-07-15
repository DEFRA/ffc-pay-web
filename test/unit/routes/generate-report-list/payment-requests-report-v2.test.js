jest.mock('../../../../app/helpers', () => ({
  generateReportHandler: jest.fn((_type, _filenameFn, _opts) => jest.fn()),
  createDownloadRoute: jest.fn((path, view, schema, handler) => ({ method: 'GET', path, view, schema, handler })),
  addDetailsToFilename: jest.fn((base, _payload) => base),
  getView: jest.fn()
}))

jest.mock('../../../../app/config', () => ({
  storageConfig: {
    paymentRequestsReportName: 'payment-requests.csv'
  }
}))

jest.mock('../../../../app/routes/schemas/standard-report-schema', () => ({}))

const { getView, createDownloadRoute, generateReportHandler, addDetailsToFilename } = require('../../../../app/helpers')
const GENERATE_REPORT_LIST = require('../../../../app/constants/generate-report-list')
const GENERATE_REPORT_VIEWS = require('../../../../app/constants/generate-report-views')

const routes = require('../../../../app/routes/generate-report-list/payment-requests-report-v2')

const makeH = () => ({ view: jest.fn().mockReturnValue('view-response') })

describe('payment-requests-report-v2 routes', () => {
  test('exports two routes', () => {
    expect(routes).toHaveLength(2)
  })

  test('createDownloadRoute is called with correct path', () => {
    expect(createDownloadRoute).toHaveBeenCalledWith(
      GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD,
      GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2,
      expect.anything(),
      expect.anything()
    )
  })

  test('generateReportHandler filenameFn calls addDetailsToFilename with paymentRequestsReportName', () => {
    const filenameFn = generateReportHandler.mock.calls[0][1]
    const mockPayload = { schemeId: '1', year: '2025' }
    filenameFn(mockPayload)
    expect(addDetailsToFilename).toHaveBeenCalledWith('payment-requests.csv', mockPayload)
  })

  describe('GET /generate-payment-request-statuses handler', () => {
    let getRoute

    beforeEach(() => {
      jest.clearAllMocks()
      getRoute = routes.find(r => r.path === GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2)
    })

    test('calls getView with noResults false when query param is absent', async () => {
      getView.mockResolvedValue('view-response')
      const h = makeH()
      await getRoute.options.handler({ query: {} }, h)

      expect(getView).toHaveBeenCalledWith(
        GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2,
        h,
        { noResults: false }
      )
    })

    test('calls getView with noResults true when query param is "true"', async () => {
      getView.mockResolvedValue('view-response')
      const h = makeH()
      await getRoute.options.handler({ query: { noResults: 'true' } }, h)

      expect(getView).toHaveBeenCalledWith(
        GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2,
        h,
        { noResults: true }
      )
    })

    test('calls getView with noResults false when query param is "false"', async () => {
      getView.mockResolvedValue('view-response')
      const h = makeH()
      await getRoute.options.handler({ query: { noResults: 'false' } }, h)

      expect(getView).toHaveBeenCalledWith(
        GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2,
        h,
        { noResults: false }
      )
    })
  })
})
