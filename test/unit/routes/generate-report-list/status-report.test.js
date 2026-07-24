jest.mock('../../../../app/storage/doc-reports', () => ({
  getValidReportYearsByType: jest.fn(),
  getReportsByYearAndType: jest.fn(),
  getStatusReport: jest.fn()
}))
jest.mock('../../../../app/helpers', () => ({
  handleStreamResponse: jest.fn()
}))

const { getValidReportYearsByType, getReportsByYearAndType, getStatusReport } = require('../../../../app/storage/doc-reports')
const { handleStreamResponse } = require('../../../../app/helpers')
const { applicationAdmin, statusReportSfi23, statusReportsDelinked } = require('../../../../app/auth/permissions')
const GENERATE_REPORT_LIST = require('../../../../app/constants/generate-report-list')
const GENERATE_REPORT_VIEWS = require('../../../../app/constants/generate-report-views')

const routes = require('../../../../app/routes/generate-report-list/status-report')

const makeH = () => ({
  view: jest.fn().mockReturnValue('view-response')
})

const findRoute = (path) => routes.find(r => r.path === path)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('status-report routes', () => {
  test('exports three routes', () => {
    expect(routes).toHaveLength(3)
  })

  describe('GET STATUS route', () => {
    let route

    beforeEach(() => {
      route = findRoute(GENERATE_REPORT_LIST.STATUS)
    })

    test('renders view with filtered report types for user with specific scope', async () => {
      getValidReportYearsByType.mockResolvedValue([{ year: 2025, type: 'SFI-23' }])
      const h = makeH()
      const request = { auth: { credentials: { scope: [statusReportSfi23] } } }

      await route.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(GENERATE_REPORT_VIEWS.STATUS, {
        reportTypeItems: [{ value: 'sustainable-farming-incentive', text: 'SFI-23' }],
        yearTypeItems: [{ year: 2025, type: 'SFI-23' }]
      })
    })

    test('applicationAdmin scope includes all report types', async () => {
      getValidReportYearsByType.mockResolvedValue([])
      const h = makeH()
      const request = { auth: { credentials: { scope: [applicationAdmin] } } }

      await route.options.handler(request, h)

      const callArgs = h.view.mock.calls[0][1]
      expect(callArgs.reportTypeItems).toEqual([
        { value: 'sustainable-farming-incentive', text: 'SFI-23' },
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])
    })

    test('user with delinked scope only sees delinked report type', async () => {
      getValidReportYearsByType.mockResolvedValue([])
      const h = makeH()
      const request = { auth: { credentials: { scope: [statusReportsDelinked] } } }

      await route.options.handler(request, h)

      const callArgs = h.view.mock.calls[0][1]
      expect(callArgs.reportTypeItems).toEqual([
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])
    })

    test('user with no matching scope sees no report types', async () => {
      getValidReportYearsByType.mockResolvedValue([])
      const h = makeH()
      const request = { auth: { credentials: { scope: [] } } }

      await route.options.handler(request, h)

      const callArgs = h.view.mock.calls[0][1]
      expect(callArgs.reportTypeItems).toEqual([])
    })

    test('defaults to empty array when credentials scope is undefined', async () => {
      getValidReportYearsByType.mockResolvedValue([])
      const h = makeH()
      const request = { auth: { credentials: {} } }

      await route.options.handler(request, h)

      const callArgs = h.view.mock.calls[0][1]
      expect(callArgs.reportTypeItems).toEqual([])
    })

    test('throws Boom error when getValidReportYearsByType fails', async () => {
      getValidReportYearsByType.mockRejectedValue(new Error('Storage error'))
      const h = makeH()
      const request = { auth: { credentials: { scope: [statusReportSfi23] } } }

      await expect(route.options.handler(request, h)).rejects.toThrow(
        'Unable to retrieve the report data from the server. Please try again later.'
      )
    })
  })

  describe('GET STATUS_SEARCH route', () => {
    let route

    beforeEach(() => {
      route = findRoute(GENERATE_REPORT_LIST.STATUS_SEARCH)
    })

    test('renders results view with known report type display name', async () => {
      const mockReports = [{ name: 'report.csv', date: new Date('2025-01-01') }]
      getReportsByYearAndType.mockResolvedValue(mockReports)
      const h = makeH()
      const request = { query: { 'select-type': 'sustainable-farming-incentive', 'report-year': '2025' } }

      await route.options.handler(request, h)

      expect(getReportsByYearAndType).toHaveBeenCalledWith('2025', 'sustainable-farming-incentive')
      expect(h.view).toHaveBeenCalledWith(
        GENERATE_REPORT_VIEWS.STATUS_RESULTS,
        expect.objectContaining({ reportTitle: 'SFI-23 payment status reports - 2025' })
      )
    })

    test('falls back to raw type string in title for unknown report type', async () => {
      getReportsByYearAndType.mockResolvedValue([])
      const h = makeH()
      const request = { query: { 'select-type': 'unknown-type', 'report-year': '2024' } }

      await route.options.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        GENERATE_REPORT_VIEWS.STATUS_RESULTS,
        expect.objectContaining({ reportTitle: 'unknown-type payment status reports - 2024' })
      )
    })
  })

  describe('GET STATUS_DOWNLOAD route', () => {
    let route

    beforeEach(() => {
      route = findRoute(GENERATE_REPORT_LIST.STATUS_DOWNLOAD)
    })

    test('calls handleStreamResponse with basename of full path and stream getter', async () => {
      const fakeStream = {}
      getStatusReport.mockReturnValue(fakeStream)
      handleStreamResponse.mockReturnValue('stream-response')
      const h = makeH()
      const request = { query: { 'file-name': 'reports/subdir/report-file.csv' } }

      const result = await route.options.handler(request, h)

      expect(handleStreamResponse).toHaveBeenCalledWith(
        expect.any(Function),
        'report-file.csv',
        h
      )
      expect(result).toBe('stream-response')
    })

    test('passes getStatusReport getter to handleStreamResponse', async () => {
      handleStreamResponse.mockImplementation(async (getter) => getter())
      const h = makeH()
      const fullPath = 'path/to/report.csv'
      const request = { query: { 'file-name': fullPath } }

      await route.options.handler(request, h)

      expect(getStatusReport).toHaveBeenCalledWith(fullPath)
    })
  })
})
