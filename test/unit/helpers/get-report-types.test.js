const { getReportTypes } = require('../../../app/helpers/get-report-types')

jest.mock('../../../app/config')

describe('getReportTypes', () => {
  let consoleSpy

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.resetModules()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('should return authreport types', () => {
    const reportTypes = getReportTypes()

    expect(reportTypes).toEqual({
      'Payment request statuses': 'payment-requests-v2',
      'Suppressed payment requests': 'suppressed-payments',
      'AP-AR listing report': 'ap-ar-report',
      Holds: 'holds',
      'Request Editor report': 'request-editor-report',
      'Payment statement status report': 'status-report'
    })
  })
})
