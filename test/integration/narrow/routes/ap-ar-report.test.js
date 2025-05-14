const Hapi = require('@hapi/hapi')

jest.mock('../../../../app/helpers', () => {
  const actualRouteGen = require('../../../../app/helpers/report-route-generator')
  return {
    generateReportHandler: jest.fn((_, filenameFn) => {
      return async (request, h) => {
        const filename = filenameFn(request.query)
        return h.response('csv-content')
          .header('content-type', 'text/csv')
          .header('content-disposition', `attachment; filename="${filename}"`)
      }
    }),
    addDetailsToFilename: jest.fn((base, payload) => `${base}-${payload.reportType}`),
    createFormRoute: actualRouteGen.createFormRoute,
    createDownloadRoute: actualRouteGen.createDownloadRoute
  }
})

jest.mock('../../../../app/helpers/get-view', () => ({
  getView: jest.fn()
}))
jest.mock('../../../../app/helpers/render-error-page', () => ({
  renderErrorPage: jest.fn()
}))

jest.mock('../../../../app/config', () => ({
  storageConfig: {
    apListingReportName: 'ap-report.csv',
    arListingReportName: 'ar-report.csv'
  }
}))

jest.mock('../../../../app/routes/schemas/ap-ar-report-schema', () => {
  const Joi = require('joi')
  return Joi.object({
    reportType: Joi.string().valid('AP', 'AR').required()
  })
})

const { getView } = require('../../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../../app/helpers/render-error-page')
const REPORT_LIST = require('../../../../app/constants/report-list')
const REPORT_VIEWS = require('../../../../app/constants/report-views')
const routes = require('../../../../app/routes/report-list/ap-ar-report')

describe('AP/AR Report Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })

    const unauthedRoutes = routes.map(route => ({
      ...route,
      options: { ...route.options, auth: false }
    }))

    server.route(unauthedRoutes)
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET form route returns view', async () => {
    getView.mockResolvedValue('<html>form</html>')

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.AP_AR
    })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('<html>form</html>')
    expect(getView).toHaveBeenCalledWith(REPORT_VIEWS.AP_AR, expect.any(Object))
  })

  test('GET download route with valid params returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.AP_AR_DOWNLOAD}?reportType=AP`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="default-report.csv-AP"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route with missing param returns error view', async () => {
    renderErrorPage.mockImplementation((view, req, h) => h.response().code(400))

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.AP_AR_DOWNLOAD
    })

    expect(res.statusCode).toBe(500)
    expect(res.payload).toContain('Internal Server Error')
  })
})
