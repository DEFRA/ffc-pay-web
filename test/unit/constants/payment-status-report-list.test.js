const REPORT_LIST = require('../../../app/constants/payment-status-report-list')

describe('Payment Status Report List constants', () => {
  test('exports correct base paths', () => {
    expect(REPORT_LIST.STATUS).toBe('/status-report')
    expect(REPORT_LIST.STATUS_SEARCH).toBe('/status-report/search')
  })

  test('exports correct download paths', () => {
    expect(REPORT_LIST.STATUS_DOWNLOAD).toBe('/status-report/download')
    expect(REPORT_LIST.STATUS_DOWNLOAD_PREPARE).toBe('/status-report/download/prepare')
  })

  test('all paths are strings', () => {
    Object.values(REPORT_LIST).forEach(path => {
      expect(typeof path).toBe('string')
    })
  })
})
