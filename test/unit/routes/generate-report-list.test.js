jest.mock('../../../app/helpers/generate-report-types')

const { generateReportTypes } = require('../../../app/helpers/generate-report-types')

const MOCK_REPORT_TYPES = {
  'Find a payment statement status report': 'find-payment-statement-status-report',
  'Generate a payment request statuses': 'generate-payment-request-statuses',
  'Generate an AP-AR listing report': 'generate-ap-ar-listing-report'
}

const route = require('../../../app/routes/generate-report-list')

beforeEach(() => {
  jest.clearAllMocks()
  generateReportTypes.mockReturnValue(MOCK_REPORT_TYPES)
})

const makeH = () => ({
  view: jest.fn().mockReturnValue('view-response')
})

describe('generate-report-list route', () => {
  test('has GET method', () => {
    expect(route.method).toBe('GET')
  })

  test('has correct path', () => {
    expect(route.path).toBe('/generate-report-list')
  })

  test('has correct auth scope', () => {
    const { applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked } = require('../../../app/auth/permissions')
    expect(route.options.auth.scope).toEqual([applicationAdmin, holdAdmin, schemeAdmin, dataView, statusReportSfi23, statusReportsDelinked])
  })

  test('handler calls generateReportTypes and renders view with correct data', async () => {
    const h = makeH()
    const result = await route.options.handler({}, h)

    expect(generateReportTypes).toHaveBeenCalledTimes(1)

    const expectedKeys = Object.keys(MOCK_REPORT_TYPES)
    expect(h.view).toHaveBeenCalledWith('generate-report-list', {
      reportTypes: expectedKeys,
      reportTypesRoutes: MOCK_REPORT_TYPES,
      totalReportTypes: expectedKeys.length
    })
    expect(result).toBe('view-response')
  })
})
