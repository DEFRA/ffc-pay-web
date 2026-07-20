const { generateReportTypes } = require('../../../app/helpers/generate-report-types')

describe('generateReportTypes', () => {
  test('should return generate report types', () => {
    const reportTypes = generateReportTypes()

    expect(reportTypes).toEqual({
      'Generate a payment request statuses': 'generate-payment-request-statuses',
      'Generate an AP-AR listing report': 'generate-ap-ar-listing-report'
    })
  })
})
