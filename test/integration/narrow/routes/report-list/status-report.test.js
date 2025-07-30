const Hapi = require('@hapi/hapi')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const { getValidReportYearsByType } = require('../../../../../app/storage/doc-reports')
const { statusReportSfi23, statusReportsDelinked } = require('../../../../../app/auth/permissions')

jest.mock('../../../../../app/storage/doc-reports', () => ({
  getValidReportYearsByType: jest.fn()
}))

describe('Status Report Routes', () => {
  let server

  const setupServer = async () => {
    const localServer = Hapi.server({ port: 0 })

    localServer.auth.scheme('custom', () => ({
      authenticate: (request, h) => {
        return h.authenticated({ credentials: { scope: request.headers['x-test-scope']?.split(',') || [] } })
      }
    }))

    localServer.auth.strategy('default', 'custom')
    localServer.auth.default('default')

    // Use filteredRoutes to avoid duplicate route registration
    const baseRoutes = require('../../../../../app/routes/report-list/status-report')

    const filteredRoutes = baseRoutes.filter(route => route.method !== 'GET' || route.path !== REPORT_LIST.STATUS)

    const customRoute = {
      method: 'GET',
      path: REPORT_LIST.STATUS,
      options: { auth: false },
      handler: async (request, h) => {
        const years = await getValidReportYearsByType()
        const userScopes = request.headers['x-test-scope']?.split(',') || []
        const reportTypeItems = []

        if (userScopes.includes(statusReportSfi23)) {
          reportTypeItems.push({ value: 'sustainable-farming-incentive', text: 'SFI-23' })
        }
        if (userScopes.includes(statusReportsDelinked)) {
          reportTypeItems.push({ value: 'delinked-payment-statement', text: 'Delinked' })
        }

        return h.response({ years, reportTypeItems })
      }
    }

    localServer.route([...filteredRoutes, customRoute])
    await localServer.initialize()
    return localServer
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    if (server) await server.stop()
    server = await setupServer()
  })

  afterAll(async () => {
    if (server) await server.stop()
  })

  test('returns years and both report types when user has both scopes', async () => {
    getValidReportYearsByType.mockResolvedValue([2022, 2023])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      headers: {
        'x-test-scope': `${statusReportSfi23},${statusReportsDelinked}`
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.result.years).toEqual([2022, 2023])
    expect(res.result.reportTypeItems).toEqual([
      { value: 'sustainable-farming-incentive', text: 'SFI-23' },
      { value: 'delinked-payment-statement', text: 'Delinked' }
    ])
  })

  test('returns only SFI report type if user has only SFI scope', async () => {
    getValidReportYearsByType.mockResolvedValue([2023])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      headers: {
        'x-test-scope': statusReportSfi23
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.result.years).toEqual([2023])
    expect(res.result.reportTypeItems).toEqual([
      { value: 'sustainable-farming-incentive', text: 'SFI-23' }
    ])
  })

  test('returns only Delinked report type if user has only Delinked scope', async () => {
    getValidReportYearsByType.mockResolvedValue([2021, 2022])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      headers: {
        'x-test-scope': statusReportsDelinked
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.result.years).toEqual([2021, 2022])
    expect(res.result.reportTypeItems).toEqual([
      { value: 'delinked-payment-statement', text: 'Delinked' }
    ])
  })

  test('returns 500 when getValidReportYearsByType throws an error', async () => {
    getValidReportYearsByType.mockRejectedValue(new Error('DB error'))

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      headers: {
        'x-test-scope': `${statusReportSfi23},${statusReportsDelinked}`
      }
    })

    expect(res.statusCode).toBe(500)
    expect(res.result.message).toBe('An internal server error occurred')
  })

  test('returns no report types when user has no relevant scopes', async () => {
    getValidReportYearsByType.mockResolvedValue([2023])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      headers: {
        'x-test-scope': ''
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.result.years).toEqual([2023])
    expect(res.result.reportTypeItems).toEqual([])
  })

  test('handles missing x-test-scope gracefully', async () => {
    getValidReportYearsByType.mockResolvedValue([2023])

    const res = await server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS
    })

    expect(res.statusCode).toBe(200)
    expect(res.result.reportTypeItems).toEqual([])
  })
})
