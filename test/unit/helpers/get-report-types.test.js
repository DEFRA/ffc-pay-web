const config = require('../../../app/config')
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

  test('should return all report types when legacyReportsActive is true', () => {
    config.legacyReportsActive = true

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

  test('should return limited report types when legacyReportsActive is false', () => {
    config.legacyReportsActive = false

    const reportTypes = getReportTypes()

    expect(reportTypes).toEqual({
      'Payment request statuses': 'payment-requests',
      'Suppressed payment requests': 'suppressed-payments',
      Holds: 'holds',
      'Payment statement status report': 'status-report'

    })
  })

  test('logs "Legacy reports are active in this environment." when LEGACY_REPORTS_ACTIVE is set', () => {
    process.env.LEGACY_REPORTS_ACTIVE = 'true'
    config.legacyReportsActive = true
    getReportTypes()
    expect(consoleSpy).toHaveBeenCalledWith('Legacy reports are active in this environment.')
  })

  test('logs "Legacy reports are not active in this environment." when LEGACY_REPORTS_ACTIVE is not set', () => {
    delete process.env.LEGACY_REPORTS_ACTIVE
    config.legacyReportsActive = false
    getReportTypes()
    expect(consoleSpy).toHaveBeenCalledWith('Legacy reports are not active in this environment.')
  })
})
