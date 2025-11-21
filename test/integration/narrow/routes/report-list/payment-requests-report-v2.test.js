const Hapi = require('@hapi/hapi')

jest.mock('../../../../../app/helpers', () => {
  const actualRouteGen = require('../../../../../app/helpers/report-route-generator')
  return {
    generateReportHandler: jest.fn((_, filenameFn) => async (request, h) => {
      const filename = filenameFn(request.query)
      return h
        .response('csv-content')
        .header('content-type', 'text/csv')
        .header('content-disposition', `attachment; filename="${filename}"`)
    }),
    addDetailsToFilename: jest.fn((base, payload) => `${base}-${payload.schemeId}-${payload.year}`),
    createFormRoute: actualRouteGen.createFormRoute,
    createDownloadRoute: actualRouteGen.createDownloadRoute
  }
})

jest.mock('../../../../../app/helpers/get-view', () => ({ getView: jest.fn() }))
jest.mock('../../../../../app/helpers/render-error-page', () => ({ renderErrorPage: jest.fn() }))
jest.mock('../../../../../app/config', () => ({ storageConfig: { paymentRequestsReportName: 'payment-requests.csv' } }))
jest.mock('../../../../../app/routes/schemas/standard-report-schema', () => {
  const Joi = require('joi')
  return Joi.object({ schemeId: Joi.string().required(), year: Joi.string().required() })
})

const { getView } = require('../../../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../../../app/helpers/render-error-page')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const REPORT_VIEWS = require('../../../../../app/constants/report-views')
const routes = require('../../../../../app/routes/report-list/payment-requests-report-v2')

describe('Payment Requests V2 Report Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => { await server.stop() })

  test('GET form route returns view', async () => {
    getView.mockResolvedValue('<html>payment-requests form</html>')

    const res = await server.inject({ method: 'GET', url: REPORT_LIST.PAYMENT_REQUESTS_V2 })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('<html>payment-requests form</html>')
    expect(getView).toHaveBeenCalledWith(REPORT_VIEWS.PAYMENT_REQUESTS_V2, expect.any(Object))
  })

  test('GET download route with valid params returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD}?schemeId=1&year=2025`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="payment-requests.csv-1-2025"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route missing required params renders error page', async () => {
    renderErrorPage.mockImplementation((v, req, h) => h.response('error').code(400))

    const res = await server.inject({ method: 'GET', url: REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.payload).toContain('error')
  })
})
