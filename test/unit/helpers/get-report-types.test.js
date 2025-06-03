const config = require('../../../app/config')
const { getReportTypes } = require('../../../app/helpers/get-report-types')

jest.mock('../../../app/config')

describe('getReportTypes', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('should return all report types when legacyReportsActive is true', () => {
    config.legacyReportsActive = true

    const reportTypes = getReportTypes()

    expect(reportTypes).toEqual({
      'Payment request statuses': 'payment-requests',
      'Payment request statuses v2': 'payment-requests-v2',
      'Combined transaction report': 'transaction-summary',
      'Suppressed payment requests': 'suppressed-payments',
      'AP-AR listing report': 'ap-ar-report',
      Holds: 'holds',
      'Request Editor report': 'request-editor-report',
      'Claim level report': 'claim-level-report'
    })
  })

  test('should return limited report types when legacyReportsActive is false', () => {
    config.legacyReportsActive = false

    const reportTypes = getReportTypes()

    expect(reportTypes).toEqual({
      'Payment request statuses': 'payment-requests',
      'Suppressed payment requests': 'suppressed-payments',
      Holds: 'holds'
    })
  })
})
