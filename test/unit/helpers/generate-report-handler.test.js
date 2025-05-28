const { generateReportHandler } = require('../../../app/helpers/generate-report-handler')
const uuid = require('uuid')
const setReportStatus = require('../../../app/helpers/set-report-status')
const { buildReportUrl } = require('../../../app/helpers/build-query-url')
const { queryTrackingApi } = require('../../../app/helpers/query-tracking-api')
const { normaliseQuery } = require('../../../app/helpers/normalise-query')

jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('../../../app/helpers/set-report-status')
jest.mock('../../../app/helpers/build-query-url')
jest.mock('../../../app/helpers/query-tracking-api')
jest.mock('../../../app/helpers/normalise-query')

describe('generateReportHandler', () => {
  let request, h, generateFinalFilenameFunc, options

  beforeEach(() => {
    uuid.v4.mockReturnValue('job-1234')
    request = {
      query: {
        'report-url': 'http://query.url',
        'report-title': 'Query Title',
        'report-type': 'QReport',
        other: 'value'
      }
    }
    h = { view: jest.fn().mockReturnValue('view-result') }
    generateFinalFilenameFunc = jest.fn().mockReturnValue('final.csv')
    normaliseQuery.mockReturnValue({ normalized: true })
    buildReportUrl.mockReturnValue('http://built.url')
    setReportStatus.mockResolvedValue()
    queryTrackingApi.mockResolvedValue('valid.json')
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('uses options values when provided and reportType from parameter', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    const result = await handler(request, h)
    expect(uuid.v4).toHaveBeenCalled()
    expect(normaliseQuery).toHaveBeenCalledWith(request.query)
    expect(buildReportUrl).toHaveBeenCalledWith('ParamReport', { normalized: true })
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'pending',
      reportType: 'ParamReport'
    })
    expect(h.view).toHaveBeenCalledWith('report-list/report-loading', {
      jobId: 'job-1234',
      reportTitle: 'Option Title',
      reportUrl: 'http://options.url'
    })
    expect(result).toBe('view-result')
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'download',
      reportType: 'ParamReport',
      returnedFilename: 'valid.json',
      reportFilename: 'final.csv'
    })
  })

  test('falls back on query values when options not provided and reportType from query is used', async () => {
    options = {}
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await handler(request, h)
    expect(buildReportUrl).toHaveBeenCalledWith('QReport', { normalized: true })
    expect(h.view).toHaveBeenCalledWith('report-list/report-loading', {
      jobId: 'job-1234',
      reportTitle: 'Query Title',
      reportUrl: 'http://query.url'
    })
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'download',
      reportType: 'QReport',
      returnedFilename: 'valid.json',
      reportFilename: 'final.csv'
    })
  })

  test('throws error in then chain if returned filename is not valid and sets status to failed', async () => {
    queryTrackingApi.mockResolvedValue('invalid.txt')
    options = {}
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    await Promise.resolve()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^Error generating report job-1234:/),
      expect.any(Error)
    )
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', { status: 'failed' })
  })

  test('handles rejection from queryTrackingApi and sets status to failed', async () => {
    queryTrackingApi.mockRejectedValue(new Error('tracking error'))
    options = {}
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    await Promise.resolve()
    expect(console.error).toHaveBeenCalledWith(
      'Error generating report job-1234:',
      new Error('tracking error')
    )
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', { status: 'failed' })
  })

  test('verifies handler creation using undefined reportType parameter (falling back to query values)', async () => {
    options = { reportUrl: 'http://option-url.com' }
    request.query['report-type'] = 'QueryDerived'
    request.query['report-title'] = 'Query Derived Title'
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await handler(request, h)
    expect(buildReportUrl).toHaveBeenCalledWith('QueryDerived', { normalized: true })
    expect(h.view).toHaveBeenCalledWith('report-list/report-loading', {
      jobId: 'job-1234',
      reportTitle: 'Query Derived Title',
      reportUrl: 'http://option-url.com'
    })
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'download',
      reportType: 'QueryDerived',
      returnedFilename: 'valid.json',
      reportFilename: 'final.csv'
    })
  })
})
