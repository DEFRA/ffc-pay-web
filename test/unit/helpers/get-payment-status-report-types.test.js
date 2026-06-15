const { getPaymentStatusReportTypes } = require('../../../app/helpers/get-payment-status-report-types')

jest.mock('../../../app/config')

describe('getPaymentStatusReportTypes', () => {
  let consoleSpy

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.resetModules()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('should return authreport types', () => {
    const reportTypes = getPaymentStatusReportTypes()

    expect(reportTypes).toEqual({
      'Payment statement status report': 'status-report'
    })
  })
})
