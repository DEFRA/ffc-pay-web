const cheerio = require('cheerio')
const REPORT_LIST = require('../../../../../app/constants/payment-status-report-list')
const { getReportsByYearAndType, getStatusReport } = require('../../../../../app/storage/doc-reports')
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

  const getSchemeRadios = ($) => {
    return $('input[name="select-type"]').map((_, el) => {
      return { value: $(el).attr('value'), label: $(el).siblings('label').text().trim() }
    }).get()
  }

  describe('GET /status-report', () => {
    test('renders search form with scheme radios for authorized user', async () => {
      const res = await server.inject({
        method: 'GET',
        url: REPORT_LIST.STATUS,
        auth: getAuth([statusReportSfi23, statusReportsDelinked])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect($('h1').text()).toContain('Payment statement status report')
      expect(getSchemeRadios($)).toEqual([
        { value: 'sustainable-farming-incentive', label: 'SFI-23' },
        { value: 'delinked-payment-statement', label: 'Delinked' }
      ])
    })

    test('filters report types based on user scope', async () => {
      const res = await server.inject({
        method: 'GET',
        url: REPORT_LIST.STATUS,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect(getSchemeRadios($)).toEqual([
        { value: 'sustainable-farming-incentive', label: 'SFI-23' }
      ])
    })

    test('returns 403 if user not authorised', async () => {
      const res = await server.inject({
        method: 'GET',
        url: REPORT_LIST.STATUS,
        auth: getAuth([dataView])
      })

      expect(res.statusCode).toBe(403)
    })

    test('applicationAdmin sees all scheme types', async () => {
      const res = await server.inject({
        method: 'GET',
        url: REPORT_LIST.STATUS,
        auth: getAuth([applicationAdmin])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect(getSchemeRadios($)).toEqual([
        { value: 'sustainable-farming-incentive', label: 'SFI-23' },
        { value: 'delinked-payment-statement', label: 'Delinked' }
      ])
    })
  })

  describe('GET /status-report/search', () => {
    test('renders report rows for selected scheme', async () => {
      const mockReports = [
        {
          name: 'sfi-2025-01-15.csv',
          date: new Date('2025-01-15'),
          type: 'sustainable-farming-incentive',
          contentLength: 5242880
        },
        {
          name: 'sfi-2025-01-14.csv',
          date: new Date('2025-01-14'),
          type: 'sustainable-farming-incentive',
          contentLength: 2097152
        }
      ]
      getReportsByYearAndType.mockResolvedValue(mockReports)

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect($('h1').text()).toContain('SFI-23 statement status reports')
      expect($('h2').text()).toContain('Available reports')

      const rows = $('.status-report-row')
      expect(rows.length).toBe(2)

      const firstRow = rows.eq(0)
      expect(firstRow.find('.govuk-link').text()).toContain('15 January 2025', 'CSV', '5.0 MB')

      const secondRow = rows.eq(1)
      expect(secondRow.find('.govuk-link').text()).toContain('14 January 2025', 'CSV', '2.0 MB')
    })

    test('renders empty state when no reports available', async () => {
      getReportsByYearAndType.mockResolvedValue([])

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect($('p.govuk-body').last().text()).toContain('No reports are available for this scheme and year')
    })

    test('returns 400 if scheme is not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(400)
      expect(res.result.message).toContain('A scheme is required to search for status reports')
    })

    test('includes start new search link', async () => {
      getReportsByYearAndType.mockResolvedValue([])

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive`,
        auth: getAuth([statusReportSfi23])
      })

      const $ = loadPayload(res.payload)
      const searchLink = $('a:contains("start a new search")')
      expect(searchLink.attr('href')).toBe('/status-report')
    })

    test('report rows link to prepare page with filename and scheme', async () => {
      const mockReports = [
        {
          name: 'sfi-2025-01-15.csv',
          date: new Date('2025-01-15'),
          type: 'sustainable-farming-incentive',
          contentLength: 5242880
        }
      ]
      getReportsByYearAndType.mockResolvedValue(mockReports)

      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_SEARCH}?select-type=sustainable-farming-incentive`,
        auth: getAuth([statusReportSfi23])
      })

      const $ = loadPayload(res.payload)
      const reportLink = $('.status-report-row .govuk-link').first()
      expect(reportLink.attr('href')).toContain('/status-report/download/prepare')
      expect(reportLink.attr('href')).toContain('file-name=')
      expect(reportLink.attr('href')).toContain('scheme=SFI-23')
    })
  })

  describe('GET /status-report/download/prepare', () => {
    test('renders preparing message and shows scheme name', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?file-name=sfi-report-2025-01-15.csv&scheme=SFI-23`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(200)
      const $ = loadPayload(res.payload)
      expect($('h2').text()).toContain('Preparing your report')
      expect($('#preparing-message').text()).toContain('The report is being prepared and will begin downloading to your device')
      expect($('#preparing-message').text()).toContain('larger files may take longer')
    })

    test('includes download complete success banner (hidden initially)', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?file-name=sfi-report-2025-01-15.csv&scheme=SFI-23`,
        auth: getAuth([statusReportSfi23])
      })

      const $ = loadPayload(res.payload)
      const banner = $('#download-complete')
      expect(banner.attr('hidden')).toBeDefined()
      expect(banner.find('.govuk-notification-banner__heading').text()).toContain('Download complete')
    })

    test('displays correct filename and scheme in success message', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?file-name=sfi-report-2025-01-15.csv&scheme=SFI-23`,
        auth: getAuth([statusReportSfi23])
      })

      const $ = loadPayload(res.payload)
      const successText = $('#download-complete .govuk-body').text()
      expect(successText).toContain('sfi-report-2025-01-15.csv')
      expect(successText).toContain('SFI-23')
      expect(successText).toContain('statement status report has been successfully downloaded')
    })

    test('does not include start new search link on prepare page', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?file-name=sfi-report.csv&scheme=SFI-23`,
        auth: getAuth([statusReportSfi23])
      })

      const $ = loadPayload(res.payload)
      const searchLink = $('a:contains("Start a new search")')
      expect(searchLink.length).toBe(0)
    })

    test('returns 400 if file-name not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD_PREPARE}?scheme=SFI-23`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(400)
      expect(res.result.message).toContain('A report filename is required')
    })
  })

  describe('GET /status-report/download', () => {
    test('streams CSV report for download', async () => {
      const fakeStream = { pipe: jest.fn() }
      getStatusReport.mockResolvedValue(fakeStream)
      handleStreamResponse.mockImplementation(async (streamFn, filename, h) => {
        await streamFn()
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
      expect(handleStreamResponse).toHaveBeenCalled()
    })

    test('calls getStatusReport with correct filename', async () => {
      getStatusReport.mockResolvedValue({ pipe: jest.fn() })
      handleStreamResponse.mockImplementation(async (streamFn, filename, h) => {
        await streamFn()
        return h.response('content')
      })

      await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=my-report.csv`,
        auth: getAuth([statusReportSfi23])
      })

      expect(getStatusReport).toHaveBeenCalledWith('my-report.csv')
    })

    test('returns 400 if file-name not provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD}`,
        auth: getAuth([statusReportSfi23])
      })

      expect(res.statusCode).toBe(400)
      expect(res.result.message).toContain('A report filename is required')
    })

    test('returns 403 if user not authorised', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `${REPORT_LIST.STATUS_DOWNLOAD}?file-name=test.csv`,
        auth: getAuth([dataView])
      })

      expect(res.statusCode).toBe(403)
    })
  })
})
