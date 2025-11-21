const cheerio = require('cheerio')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const { getValidReportYearsByType, getReportsByYearAndType, getStatusReport } = require('../../../../../app/storage/doc-reports')
const { handleStreamResponse } = require('../../../../../app/helpers')
const { statusReportSfi23, statusReportsDelinked, dataView, applicationAdmin } = require('../../../../../app/auth/permissions')
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/storage/doc-reports')
jest.mock('../../../../../app/helpers/handle-stream-response.js', () => ({ handleStreamResponse: jest.fn() }))
jest.mock('../../../../../app/auth')

describe('Status Report Routes', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
    jest.clearAllMocks()
  })

  const getAuth = (scopes) => {
    return { strategy: 'session-auth', credentials: { scope: scopes } }
  }

  const loadPayload = (payload) => {
    return cheerio.load(payload)
  }

  const getReportTypes = ($) => {
    return $('#select-type option').filter((_, el) => {
      return !$(el).attr('hidden')
    }).map((_, el) => {
      return { value: $(el).attr('value'), text: $(el).text().trim() }
    }).get()
  }

  const getYearOptions = ($) => {
    return $('#report-year option').map((_, el) => {
      return { value: $(el).attr('value'), type: $(el).attr('data-type') }
    }).get()
  }

  const injectGetStatus = (auth) => {
    return server.inject({ method: 'GET', url: REPORT_LIST.STATUS, auth })
  }

  describe('GET /status-report', () => {
    test('renders correct report types and years for user', async () => {
      getValidReportYearsByType.mockResolvedValue([{ year: 2022, type: 'SFI-23' }, { year: 2023, type: 'SFI-23' }])
      const res = await injectGetStatus(getAuth([statusReportSfi23, statusReportsDelinked]))
      expect(res.statusCode).toBe(200)

      const $ = loadPayload(res.payload)
      expect(getReportTypes($)).toEqual([
        { value: 'sustainable-farming-incentive', text: 'SFI-23' },
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])
      expect(getYearOptions($)).toEqual([{ value: '2022', type: 'SFI-23' }, { value: '2023', type: 'SFI-23' }])
    })

    test('filters report types based on user scope', async () => {
      getValidReportYearsByType.mockResolvedValue([{ year: 2023, type: 'SFI-23' }])
      const res = await injectGetStatus(getAuth([statusReportSfi23]))
      const $ = loadPayload(res.payload)
      expect(getReportTypes($)).toEqual([{ value: 'sustainable-farming-incentive', text: 'SFI-23' }])
      expect(getYearOptions($)).toEqual([{ value: '2023', type: 'SFI-23' }])
    })

    test('returns 500 if fetching years fails', async () => {
      getValidReportYearsByType.mockRejectedValue(new Error('DB error'))
      const res = await injectGetStatus(getAuth([statusReportSfi23, statusReportsDelinked]))
      expect(res.statusCode).toBe(500)
      expect(res.result).toContain('Unable to retrieve the report data')
    })

    test('returns 403 if user not authorised', async () => {
      getValidReportYearsByType.mockResolvedValue([{ year: 2023, type: 'SFI-23' }])
      const res = await injectGetStatus(getAuth([dataView]))
      expect(res.statusCode).toBe(403)
      expect(res.result).toContain('Sorry, you are not authorised')
    })

    test('applicationAdmin sees all report types', async () => {
      getValidReportYearsByType.mockResolvedValue([{ year: 2023, type: 'SFI-23' }, { year: 2023, type: 'Delinked' }])
      const res = await injectGetStatus(getAuth([applicationAdmin]))
      const $ = loadPayload(res.payload)
      expect(getReportTypes($)).toEqual([
        { value: 'sustainable-farming-incentive', text: 'SFI-23' },
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])
    })
  })

  describe('GET /status-report/search', () => {
    test('renders report results for selected year/type', async () => {
      const mockReports = [{ name: 'sfi-2025.csv', date: new Date('2025-01-01'), type: 'SFI-23' }]
      getReportsByYearAndType.mockResolvedValue(mockReports)

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive&report-year=2025`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect($('h1').text()).toContain('SFI-23 Payment Status Reports - 2025')
      expect($('.govuk-task-list__item').length).toBe(1)
    })
  })

  describe('GET /status-report/download', () => {
    test('streams CSV report for download', async () => {
      const fakeStream = { pipe: jest.fn() }
      getStatusReport.mockReturnValue(fakeStream)
      handleStreamResponse.mockImplementation((stream, filename, h) => {
        return h.response('csv content').header('Content-Disposition', `attachment; filename="${filename}"`)
      })

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=test-file.csv`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-disposition']).toContain('attachment; filename="test-file.csv"')
      expect(res.payload).toBe('csv content')
    })
  })
})
