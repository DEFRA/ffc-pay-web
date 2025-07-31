const cheerio = require('cheerio')
const REPORT_LIST = require('../../../../../app/constants/report-list')
const {
  getValidReportYearsByType
} = require('../../../../../app/storage/doc-reports')
const {
  statusReportSfi23,
  statusReportsDelinked,
  dataView
} = require('../../../../../app/auth/permissions')

const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/storage/doc-reports', () => ({
  getValidReportYearsByType: jest.fn()
}))
jest.mock('../../../../../app/auth')

describe('Status Report Routes', () => {
  let server

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

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
    jest.clearAllMocks()
  })

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
