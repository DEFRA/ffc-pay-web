const Hapi = require('@hapi/hapi')

jest.mock('../../../../../app/helpers', () => {
  const actualRouteGen = require('../../../../../app/helpers/report-route-generator')
  return {
    generateReportHandler: jest.fn((_, filenameFn) => async (request, h) => {
      const filename = filenameFn(request.query)
      return h.response('csv-content')
        .header('content-type', 'text/csv')
        .header('content-disposition', `attachment; filename="${filename}"`)
    }),
    addDetailsToFilename: jest.fn((base, payload) => `${base}-${payload.reportType}`),
    createFormRoute: actualRouteGen.createFormRoute,
    createDownloadRoute: actualRouteGen.createDownloadRoute
  }
})

jest.mock('../../../../../app/helpers/get-view', () => ({ getView: jest.fn() }))
jest.mock('../../../../../app/helpers/render-error-page', () => ({ renderErrorPage: jest.fn() }))
jest.mock('../../../../../app/config', () => ({
  storageConfig: { apListingReportName: 'ap-report.csv', arListingReportName: 'ar-report.csv' }
}))
jest.mock('../../../../../app/routes/schemas/reports/ap-ar-report-schema', () => {
  const Joi = require('joi')
  return Joi.object({ reportType: Joi.string().valid('ap-listing-report', 'ar-listing-report').required() })
})

const { getView } = require('../../../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../../../app/helpers/render-error-page')
const GENERATE_REPORT_LIST = require('../../../../../app/constants/generate-report-list')
const GENERATE_REPORT_VIEWS = require('../../../../../app/constants/generate-report-views')
const routes = require('../../../../../app/routes/generate-report-list/ap-ar-report')

describe('Generate AP/AR Report Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET form route returns view with noResults false by default', async () => {
    getView.mockResolvedValue('<html>form</html>')

    const res = await server.inject({ method: 'GET', url: GENERATE_REPORT_LIST.AP_AR })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('<html>form</html>')
    expect(getView).toHaveBeenCalledWith(GENERATE_REPORT_VIEWS.AP_AR, expect.any(Object), { noResults: false })
  })

  test('GET form route passes noResults true when query param is set', async () => {
    getView.mockResolvedValue('<html>form no results</html>')

    const res = await server.inject({ method: 'GET', url: `${GENERATE_REPORT_LIST.AP_AR}?noResults=true` })

    expect(res.statusCode).toBe(200)
    expect(getView).toHaveBeenCalledWith(GENERATE_REPORT_VIEWS.AP_AR, expect.any(Object), { noResults: true })
  })

  test('GET download route with AP type returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${GENERATE_REPORT_LIST.AP_AR_DOWNLOAD}?reportType=ap-listing-report`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="ap-report.csv-ap-listing-report"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route with AR type returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${GENERATE_REPORT_LIST.AP_AR_DOWNLOAD}?reportType=ar-listing-report`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="ar-report.csv-ar-listing-report"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route with missing param returns error view', async () => {
    renderErrorPage.mockImplementation((view, req, h) => h.response().code(400))

    const res = await server.inject({ method: 'GET', url: GENERATE_REPORT_LIST.AP_AR_DOWNLOAD })

    expect(res.statusCode).toBe(500)
    expect(res.payload).toContain('Internal Server Error')
  })
})
