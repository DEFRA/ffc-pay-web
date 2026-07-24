const GENERATE_REPORT_VIEWS = require('../../../app/constants/generate-report-views')

describe('generate-report-views constants', () => {
  test('should define generate report view paths', () => {
    expect(GENERATE_REPORT_VIEWS.AP_AR).toBe('generate-report-list/ap-ar-report')
    expect(GENERATE_REPORT_VIEWS.PAYMENT_REQUESTS_V2).toBe('generate-report-list/payment-requests-v2')
    expect(GENERATE_REPORT_VIEWS.STATUS).toBe('generate-report-list/status-report')
    expect(GENERATE_REPORT_VIEWS.STATUS_RESULTS).toBe('generate-report-list/status-report-results')
    expect(GENERATE_REPORT_VIEWS.REPORT_VALIDATION_ERROR).toBe('generate-report-list/report-validation-error')
  })
})
