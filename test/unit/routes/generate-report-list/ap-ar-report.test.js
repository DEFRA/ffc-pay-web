jest.mock('../../../../app/helpers', () => ({
  generateReportHandler: jest.fn((_type, filenameFn, _opts) => filenameFn),
  createFormRoute: jest.fn((path, view) => ({ method: 'GET', path, view })),
  createDownloadRoute: jest.fn((path, view, schema, handler) => ({ method: 'GET', path, view, schema, handler })),
  addDetailsToFilename: jest.fn((base, _payload) => base)
}))

jest.mock('../../../../app/config', () => ({
  storageConfig: {
    apListingReportName: 'ap-listing.csv',
    arListingReportName: 'ar-listing.csv'
  }
}))

jest.mock('../../../../app/routes/schemas/reports/ap-ar-report-schema', () => ({}))

const { generateReportHandler, createFormRoute, createDownloadRoute } = require('../../../../app/helpers')
const GENERATE_REPORT_LIST = require('../../../../app/constants/generate-report-list')
const GENERATE_REPORT_VIEWS = require('../../../../app/constants/generate-report-views')

const routes = require('../../../../app/routes/generate-report-list/ap-ar-report')

describe('ap-ar-report routes', () => {
  test('exports two routes', () => {
    expect(routes).toHaveLength(2)
  })

  test('createFormRoute is called with correct path and view', () => {
    expect(createFormRoute).toHaveBeenCalledWith(
      GENERATE_REPORT_LIST.AP_AR,
      GENERATE_REPORT_VIEWS.AP_AR
    )
  })

  test('createDownloadRoute is called with correct path and view', () => {
    expect(createDownloadRoute).toHaveBeenCalledWith(
      GENERATE_REPORT_LIST.AP_AR_DOWNLOAD,
      GENERATE_REPORT_VIEWS.AP_AR,
      expect.anything(),
      expect.anything()
    )
  })

  describe('getReportFilenameBasedOnType (via generateReportHandler filenameFn)', () => {
    const filenameFn = generateReportHandler.mock.calls[0][1]

    test('returns apListingReportName for AP report type', () => {
      const result = filenameFn({ reportType: 'ap-listing-report' })
      expect(result).toBe('ap-listing.csv')
    })

    test('returns arListingReportName for AR report type', () => {
      const result = filenameFn({ reportType: 'ar-listing-report' })
      expect(result).toBe('ar-listing.csv')
    })

    test('returns default-report.csv for unknown report type', () => {
      const result = filenameFn({ reportType: 'unknown-type' })
      expect(result).toBe('default-report.csv')
    })
  })
})
