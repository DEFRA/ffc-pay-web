const { downloadReportTypes } = require('../../../app/helpers/download-report-types')

describe('downloadReportTypes', () => {
  test('should return download report types', () => {
    const reportTypes = downloadReportTypes()

    expect(reportTypes).toEqual({
      'Request Editor report': 'request-editor-report',
      'Suppressed payment requests': 'suppressed-payments'
    })
  })
})
