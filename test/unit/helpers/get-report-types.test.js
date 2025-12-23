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
    delete process.env.LEGACY_REPORTS_ACTIVE
  })

  test('should return authreport types', () => {
    const reportTypes = getReportTypes()

    expect(reportTypes).toEqual({
      'Payment request statuses': 'payment-requests',
      'Suppressed payment requests': 'suppressed-payments',
      Holds: 'holds',
      'Payment statement status report': 'status-report'

    })
  })
})
