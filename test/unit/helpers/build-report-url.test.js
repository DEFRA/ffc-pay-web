const { buildReportUrl } = require('../../../app/helpers/build-query-url')
const REPORT_HANDLERS = require('../../../app/constants/report-handlers')

describe('buildReportUrl', () => {
  const reportType = Object.keys(REPORT_HANDLERS)[0]
  const baseUrl = REPORT_HANDLERS[reportType]

  test.each([
    [{ startDate: '2024-01-01', endDate: '2024-02-01' }, `${baseUrl}?startDate=2024-01-01&endDate=2024-02-01`],
    [{ schemeId: 'S1', year: '2023' }, `${baseUrl}?schemeId=S1&year=2023`],
    [{ schemeId: 'S2', year: '2023', prn: 7, frn: '12345' }, `${baseUrl}?schemeId=S2&year=2023&prn=7&frn=12345`],
    [{ schemeId: 'S3', year: '2024', revenueOrCapital: '  Capital  ' }, `${baseUrl}?schemeId=S3&year=2024&revenueOrCapital=Capital`],
    [{ schemeId: 'S4', year: '2025', revenueOrCapital: '   ' }, `${baseUrl}?schemeId=S4&year=2025`],
    [{ schemeId: 'X', year: '2022', prn: 9, frn: '555', revenueOrCapital: 'Revenue' }, `${baseUrl}?schemeId=X&year=2022&prn=9&frn=555&revenueOrCapital=Revenue`],
    [{}, `${baseUrl}`]
  ])('builds correct URL for payload %p', (payload, expectedUrl) => {
    expect(buildReportUrl(reportType, payload)).toBe(expectedUrl)
  })
})
