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
jest.mock('../../../../../app/config', () => ({ storageConfig: { claimLevelReportName: 'claim-level.csv' } }))
jest.mock('../../../../../app/routes/schemas/claim-level-schema', () => {
  const Joi = require('joi')
  return Joi.object({ schemeId: Joi.string().required(), year: Joi.string().required() })
})

const { getView } = require('../../../../../app/helpers/get-view')
const { renderErrorPage } = require('../../../../../app/helpers/render-error-page')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const REPORT_VIEWS = require('../../../../../app/constants/report-views')
const routes = require('../../../../../app/routes/report-list/claim-level-report')

describe('Claim Level Report Routes', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET form route returns view', async () => {
    getView.mockResolvedValue('<html>claim-level form</html>')

    const res = await server.inject({ method: 'GET', url: REPORT_LIST.CLAIM_LEVEL_REPORT })

    expect(res.statusCode).toBe(200)
    expect(res.payload).toBe('<html>claim-level form</html>')
    expect(getView).toHaveBeenCalledWith(REPORT_VIEWS.CLAIM_LEVEL_REPORT, expect.any(Object))
  })

  test('GET download route with valid params returns CSV', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${REPORT_LIST.CLAIM_LEVEL_REPORT_DOWNLOAD}?schemeId=1&year=2025`
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="claim-level.csv-1-2025"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET download route missing required params renders error page', async () => {
    renderErrorPage.mockImplementation((view, req, h) => h.response('error').code(400))

    const res = await server.inject({ method: 'GET', url: REPORT_LIST.CLAIM_LEVEL_REPORT_DOWNLOAD })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.payload).toContain('error')
  })
})
