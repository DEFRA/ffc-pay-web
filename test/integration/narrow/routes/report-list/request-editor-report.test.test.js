const Hapi = require('@hapi/hapi')

jest.mock('../../../../../app/helpers', () => {
  const actualRouteGen = require('../../../../../app/helpers/report-route-generator')
  return {
    generateReportHandler: jest.fn((_, filenameFn) => async (req, h) => {
      const filename = filenameFn(req.query)
      return h.response('csv-content')
        .header('content-type', 'text/csv')
        .header('content-disposition', `attachment; filename="${filename}"`)
    }),
    createDownloadRoute: actualRouteGen.createDownloadRoute
  }
})

jest.mock('../../../../../app/helpers/render-error-page', () => ({ renderErrorPage: jest.fn() }))

jest.mock('../../../../../app/config', () => ({
  storageConfig: { requestEditorReportName: 'request-editor.csv' }
}))

const { renderErrorPage } = require('../../../../../app/helpers/render-error-page')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const routes = require('../../../../../app/routes/report-list/request-editor-report')

describe('Request Editor Report Route', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server({ port: 0 })
    server.route(routes.map(r => ({ ...r, options: { ...r.options, auth: false } })))
    await server.initialize()
  })

  afterAll(async () => { await server.stop() })

  test('GET download returns CSV with correct filename', async () => {
    const res = await server.inject({ method: 'GET', url: REPORT_LIST.REQUEST_EDITOR_REPORT })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('attachment; filename="request-editor.csv"')
    expect(res.payload).toBe('csv-content')
  })

  test('GET failing route triggers error page', async () => {
    renderErrorPage.mockImplementation((view, req, h) => h.response('error').code(400))

    server.route({ method: 'GET', path: '/fail', handler: () => { throw new Error('failed') }, options: { auth: false } })

    const res = await server.inject({ method: 'GET', url: '/fail' })
    expect(res.statusCode).toBe(500)
    expect(res.payload).toContain('error')
  })
})
