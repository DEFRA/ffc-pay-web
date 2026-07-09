const GENERATE_REPORT_LIST = require('../../../app/constants/generate-report-list')

describe('generate-report-list constants', () => {
  test('should define generate report list paths', () => {
    expect(GENERATE_REPORT_LIST.AP_AR).toBe('/generate-report-list/generate-ap-ar-listing-report')
    expect(GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2).toBe('/generate-report-list/generate-payment-request-statuses')
    expect(GENERATE_REPORT_LIST.STATUS).toBe('/generate-report-list/find-payment-statement-status-report')
    expect(GENERATE_REPORT_LIST.STATUS_SEARCH).toBe('/generate-report-list/find-payment-statement-status-report/search')
  })

  test('should define download paths by appending /download', () => {
    expect(GENERATE_REPORT_LIST.AP_AR_DOWNLOAD).toBe('/generate-report-list/generate-ap-ar-listing-report/download')
    expect(GENERATE_REPORT_LIST.PAYMENT_REQUESTS_V2_DOWNLOAD).toBe('/generate-report-list/generate-payment-request-statuses/download')
    expect(GENERATE_REPORT_LIST.STATUS_DOWNLOAD).toBe('/generate-report-list/find-payment-statement-status-report/download')
  })
})
