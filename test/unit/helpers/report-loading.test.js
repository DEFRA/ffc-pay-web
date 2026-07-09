jest.mock('node:crypto')
jest.mock('../../../app/helpers/set-report-status', () => jest.fn().mockResolvedValue())
jest.mock('../../../app/helpers/query-tracking-api', () => ({ queryTrackingApi: jest.fn().mockResolvedValue('valid.json') }))
jest.mock('../../../app/helpers/build-query-url', () => ({ buildReportUrl: jest.fn().mockReturnValue('http://built.url') }))
jest.mock('../../../app/helpers/normalise-query', () => ({ normaliseQuery: jest.fn().mockReturnValue({ normalized: true }) }))

const { generateReportHandler } = require('../../../app/helpers/generate-report-handler')
const { randomUUID } = require('node:crypto')
const DOWNLOAD_REPORT_LIST = require('../../../app/constants/download-report-list')
const GENERATE_REPORT_LIST = require('../../../app/constants/generate-report-list')

randomUUID.mockReturnValue('70cb0f07-e0cf-449c-86e8-0344f2c6cc6c')

describe('Consolidated report-loading view', () => {
  let request, h

  beforeEach(() => {
    request = { query: { 'report-url': 'http://report.url', 'report-title': 'Report Title' } }
    h = { view: jest.fn().mockReturnValue('view-result') }
  })

  test('download report handler uses /download-report-list breadcrumb and generation url', async () => {
    const handler = generateReportHandler('request-editor-report', () => 'request-editor.csv', {
      reportTitle: 'Request Editor report',
      reportUrl: DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT,
      loadingView: 'report-loading/report-loading',
      reportsUrl: '/download-report-list'
    })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('report-loading/report-loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: 'Request Editor report',
      reportUrl: DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT,
      reportsUrl: '/download-report-list'
    })
  })

  test('generate report handler uses /generate-report-list breadcrumb', async () => {
    const handler = generateReportHandler(undefined, () => 'ap-report.csv', {
      reportTitle: 'AP/AR listing report',
      reportUrl: GENERATE_REPORT_LIST.AP_AR,
      loadingView: 'report-loading/report-loading',
      reportsUrl: '/generate-report-list'
    })

    request.query['select-type'] = 'ap-listing-report'
    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('report-loading/report-loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: 'AP/AR listing report',
      reportUrl: GENERATE_REPORT_LIST.AP_AR,
      reportsUrl: '/generate-report-list'
    })
  })

  test('handler defaults reportsUrl to /generate-report-list', async () => {
    const handler = generateReportHandler('request-editor-report', () => 'request-editor.csv', {
      reportTitle: 'Request Editor report',
      reportUrl: DOWNLOAD_REPORT_LIST.REQUEST_EDITOR_REPORT,
      loadingView: 'report-loading/report-loading'
    })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('report-loading/report-loading', expect.objectContaining({
      reportsUrl: '/generate-report-list'
    }))
  })
})
