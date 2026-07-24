const DOWNLOAD_REPORT_LIST = require('../../../app/constants/download-report-list')

describe('download-report-list constants', () => {
  test('should define download report list paths', () => {
    expect(DOWNLOAD_REPORT_LIST.SUPPRESSED_PAYMENTS).toBe('/download-report-list/suppressed-payments')
    expect(DOWNLOAD_REPORT_LIST.HOLDS).toBe('/download-report-list/holds')
    expect(DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT).toBe('/download-report-list/request-editor-report')
  })
})
