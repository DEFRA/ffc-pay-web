const { buildReportUrl } = require('../../../app/helpers/build-query-url')
const REPORT_HANDLERS = require('../../../app/constants/report-handlers')

describe('buildReportUrl', () => {
  const reportType = Object.keys(REPORT_HANDLERS)[0]
  const baseUrl = REPORT_HANDLERS[reportType]

  test('uses startDate/endDate when both are present', () => {
    const payload = { startDate: '2024-01-01', endDate: '2024-02-01' }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?startDate=2024-01-01&endDate=2024-02-01`
    )
  })

  test('includes schemeId and year when provided', () => {
    const payload = { schemeId: 'S1', year: '2023' }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?schemeId=S1&year=2023`
    )
  })

  test('includes prn and frn when provided', () => {
    const payload = { schemeId: 'S2', year: '2023', prn: 7, frn: '12345' }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?schemeId=S2&year=2023&prn=7&frn=12345`
    )
  })

  test('includes trimmed revenueOrCapital when non‑empty', () => {
    const payload = {
      schemeId: 'S3',
      year: '2024',
      revenueOrCapital: '  Capital  '
    }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?schemeId=S3&year=2024&revenueOrCapital=Capital`
    )
  })

  test('omits revenueOrCapital when blank or whitespace only', () => {
    const payload = {
      schemeId: 'S4',
      year: '2025',
      revenueOrCapital: '   '
    }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?schemeId=S4&year=2025`
    )
  })

  test('builds comprehensive URL when all fields present', () => {
    const payload = {
      schemeId: 'X',
      year: '2022',
      prn: 9,
      frn: '555',
      revenueOrCapital: 'Revenue'
    }
    expect(buildReportUrl(reportType, payload)).toBe(
      `${baseUrl}?schemeId=X&year=2022&prn=9&frn=555&revenueOrCapital=Revenue`
    )
  })

  test('returns just baseUrl + "?" when payload is empty', () => {
    expect(buildReportUrl(reportType, {})).toBe(`${baseUrl}`)
  })
})
