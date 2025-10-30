const cheerio = require('cheerio')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const {
  getValidReportYearsByType,
  getReportsByYearAndType,
  getStatusReport
} = require('../../../../../app/storage/doc-reports')

const {
  handleStreamResponse
} = require('../../../../../app/helpers')

const {
  statusReportSfi23,
  statusReportsDelinked,
  dataView,
  applicationAdmin
} = require('../../../../../app/auth/permissions')

const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/storage/doc-reports', () => ({
  getValidReportYearsByType: jest.fn(),
  getReportsByYearAndType: jest.fn(),
  getStatusReport: jest.fn()
}))

jest.mock('../../../../../app/helpers/handle-stream-response.js', () => ({
  handleStreamResponse: jest.fn()
}))

jest.mock('../../../../../app/auth')

describe('Status Report List Integration Tests', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
    jest.clearAllMocks()
  })

  const emulateVisibleYearOptions = ($, selectedType) => {
    return $('#report-year option')
      .filter((_, el) => {
        const $el = $(el)
        return $el.attr('value') && $el.attr('data-type') === selectedType
      })
      .map((_, el) => {
        const $el = $(el)
        return {
          value: $el.attr('value'),
          type: $el.attr('data-type')
        }
      })
      .get()
  }

  const injectGetStatus = async (auth) => {
    return server.inject({
      method: 'GET',
      url: REPORT_LIST.STATUS,
      auth
    })
  }

  const extractReportTypes = ($) =>
    $('#select-type option').filter((_, el) => !$(el).attr('hidden')).map((_, el) => ({
      value: $(el).attr('value'),
      text: $(el).text().trim()
    })).get()

  const extractYearOptions = ($) =>
    $('#report-year option').map((_, el) => ({
      value: $(el).attr('value'),
      type: $(el).attr('data-type')
    })).get()

  const getAuth = (scopes) => ({
    strategy: 'session-auth',
    credentials: { scope: scopes }
  })

  describe('GET /status-report Route', () => {
    test('renders correct years and report types in the select elements', async () => {
      getValidReportYearsByType.mockResolvedValue([
        { year: 2022, type: 'SFI-23' },
        { year: 2023, type: 'SFI-23' }
      ])

      const res = await injectGetStatus(getAuth([statusReportSfi23, statusReportsDelinked]))
      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)

      expect(extractReportTypes($)).toEqual([
        { value: 'sustainable-farming-incentive', text: 'SFI-23' },
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])

      expect(extractYearOptions($)).toEqual([
        { value: '2022', type: 'SFI-23' },
        { value: '2023', type: 'SFI-23' }
      ])
    })

    test('returns only SFI report type if user has only SFI scope', async () => {
      getValidReportYearsByType.mockResolvedValue([
        { year: 2023, type: 'SFI-23' }
      ])

      const res = await injectGetStatus(getAuth([statusReportSfi23]))
      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)

      expect(extractReportTypes($)).toEqual([
        { value: 'sustainable-farming-incentive', text: 'SFI-23' }
      ])

      expect(extractYearOptions($)).toEqual([
        { value: '2023', type: 'SFI-23' }
      ])
    })

    test('returns only Delinked report type if user has only Delinked scope', async () => {
      getValidReportYearsByType.mockResolvedValue([
        { year: 2022, type: 'Delinked' },
        { year: 2023, type: 'SFI-23' }
      ])

      const res = await injectGetStatus(getAuth([statusReportsDelinked]))
      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)

      const reportTypes = extractReportTypes($)
      expect(reportTypes).toEqual([
        { value: 'delinked-payment-statement', text: 'Delinked' }
      ])

      const visibleYears = emulateVisibleYearOptions($, 'Delinked')
      expect(visibleYears).toEqual([
        { value: '2022', type: 'Delinked' }
      ])
    })

    test('returns 500 when getValidReportYearsByType throws an error', async () => {
      getValidReportYearsByType.mockRejectedValue(new Error('DB error'))

      const res = await injectGetStatus(getAuth([statusReportSfi23, statusReportsDelinked]))
      expect(res.statusCode).toBe(500)
      expect(res.result).toContain('Unable to retrieve the report data from the server. Please try again later.')
    })

    test('returns not authorised when user has no relevant auth scopes', async () => {
      getValidReportYearsByType.mockResolvedValue([
        { year: 2023, type: 'SFI-23' }
      ])

      const res = await injectGetStatus(getAuth([dataView])) // Invalid scope
      expect(res.statusCode).toBe(403)
      expect(res.result).toContain('Sorry, you are not authorised to perform this action')
    })
  })

  describe('GET /status-report/search Route', () => {
    test('renders results page with reports for selected year and type', async () => {
      const mockReports = [
        {
          name: 'sustainable-farming-incentive-2025-01-01T10:00:00Z.csv',
          date: new Date('2025-01-01T10:00:00Z'),
          type: 'SFI-23'
        }
      ]

      getReportsByYearAndType.mockResolvedValue(mockReports)

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive&report-year=2025`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toContain('SFI-23 Payment Status Reports - 2025')
      expect($('.govuk-task-list__item').length).toBe(1)
    })
  })

  describe('GET /status-report/download Route', () => {
    test('streams the selected CSV report for download', async () => {
      const fakeStream = {
        pipe: jest.fn()
      }

      getStatusReport.mockReturnValue(fakeStream)
      handleStreamResponse.mockImplementation((getStream, filename, h) => {
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

  test('grants all report scopes when user has applicationAdmin scope', async () => {
    getValidReportYearsByType.mockResolvedValue([
      { year: 2023, type: 'SFI-23' },
      { year: 2023, type: 'Delinked' }
    ])

    const res = await injectGetStatus(getAuth([applicationAdmin]))

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)

    expect(extractReportTypes($)).toEqual([
      { value: 'sustainable-farming-incentive', text: 'SFI-23' },
      { value: 'delinked-payment-statement', text: 'Delinked' }
    ])

    const yearOptions = extractYearOptions($)
    expect(yearOptions).toEqual([
      { value: '2023', type: 'SFI-23' },
      { value: '2023', type: 'Delinked' }
    ])
  })
})
