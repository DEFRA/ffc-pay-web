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
    createDownloadRoute: actualRouteGen.createDownloadRoute,
    getView: jest.fn().mockResolvedValue('<html>payment-requests form</html>')
  }
})

jest.mock('../../../../../app/helpers/get-view', () => ({ getView: jest.fn() }))
jest.mock('../../../../../app/helpers/render-error-page', () => ({ renderErrorPage: jest.fn() }))
jest.mock('../../../../../app/config', () => ({ storageConfig: { paymentRequestsReportName: 'payment-requests.csv' } }))
jest.mock('../../../../../app/routes/schemas/reports/standard-report-schema', () => {
  const Joi = require('joi')
  return Joi.object({ schemeId: Joi.string().required(), year: Joi.string().required() })
})

const { renderErrorPage } = require('../../../../../app/helpers/render-error-page')
const GENERATE_REPORT_LIST = require('../../../../../app/constants/generate-report-list')
const routes = require('../../../../../app/routes/generate-report-list/payment-requests-report-v2')

describe('Generate Payment Requests V2 Report Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => { await server.stop() })

  test('GET form route returns view', async () => {
    const res = await server.inject({ method: 'GET', url: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2 })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('<html>payment-requests form</html>')
  })

  test('GET download route with valid params returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD}?schemeId=1&year=2025`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="payment-requests.csv-1-2025"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route missing required params renders error page', async () => {
    renderErrorPage.mockImplementation((v, req, h) => h.response('error').code(400))

    const res = await server.inject({ method: 'GET', url: GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.payload).toContain('error')
  })
})
