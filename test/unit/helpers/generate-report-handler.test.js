const { generateReportHandler } = require('../../../app/helpers/generate-report-handler')
jest.mock('node:crypto')
const { randomUUID } = require('node:crypto')
const setReportStatus = require('../../../app/helpers/set-report-status')
const { buildReportUrl } = require('../../../app/helpers/build-query-url')
const { queryTrackingApi } = require('../../../app/helpers/query-tracking-api')
const { normaliseQuery } = require('../../../app/helpers/normalise-query')

randomUUID.mockReturnValue('70cb0f07-e0cf-449c-86e8-0344f2c6cc6c')
jest.mock('../../../app/helpers/set-report-status')
jest.mock('../../../app/helpers/build-query-url')
jest.mock('../../../app/helpers/query-tracking-api')
jest.mock('../../../app/helpers/normalise-query')

describe('generateReportHandler', () => {
  let request, h, generateFinalFilenameFunc, options

  beforeEach(() => {
    jest.clearAllMocks()
    request = {
      query: {
        'report-url': 'http://query.url',
        'report-title': 'Query Title',
        'select-type': 'QReport',
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

  const expectCommonFlow = async (handler, expectedReportType, expectedTitle, expectedUrl, expectedSchemeName) => {
    const result = await handler(request, h)
    expect(randomUUID).toHaveBeenCalled()
    expect(normaliseQuery).toHaveBeenCalledWith(request.query)
    expect(buildReportUrl).toHaveBeenCalledWith(expectedReportType, { normalized: true })
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', {
      status: 'pending',
      reportType: expectedReportType,
      schemeName: expectedSchemeName
    })
    expect(h.view).toHaveBeenCalledWith('report-loading/report-loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: expectedTitle,
      reportUrl: expectedUrl,
      reportsUrl: '/download-report-list'
    })
    expect(result).toBe('view-result')
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', {
      status: 'download',
      reportType: expectedReportType,
      returnedFilename: 'valid.json',
      reportFilename: 'final.csv',
      schemeName: expectedSchemeName
    })
  }

  test('uses options values when provided and reportType from parameter', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'ParamReport', 'Option Title', 'http://options.url', 'Option Title')
  })

  test('uses custom loading view from options', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title', loadingView: 'custom/loading' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    const result = await handler(request, h)
    expect(h.view).toHaveBeenCalledWith('custom/loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: 'Option Title',
      reportUrl: 'http://options.url',
      reportsUrl: '/download-report-list'
    })
    expect(result).toBe('view-result')
  })

  test('falls back on query values when options not provided and reportType from query', async () => {
    options = {}
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'QReport', 'Query Title', 'http://query.url', 'Query Title')
  })

  test('uses explicit schemeName option when provided', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title', schemeName: 'Delinked' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'ParamReport', 'Option Title', 'http://options.url', 'Delinked')
  })

  test('throws error if returned filename is invalid and sets status to failed', async () => {
    queryTrackingApi.mockResolvedValue('invalid.txt')
    options = {}
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    await Promise.resolve()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^Error generating report 70cb0f07-e0cf-449c-86e8-0344f2c6cc6c:/),
      expect.any(Error)
    )
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', { status: 'failed' })
  })

  test('handles rejection from queryTrackingApi and sets status to failed', async () => {
    queryTrackingApi.mockRejectedValue(new Error('tracking error'))
    options = {}
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    await Promise.resolve()
    expect(console.error).toHaveBeenCalledWith(
      'Error generating report 70cb0f07-e0cf-449c-86e8-0344f2c6cc6c:',
      new Error('tracking error')
    )
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', { status: 'failed' })
  })

  test('handles undefined reportType parameter and falls back to query values', async () => {
    options = { reportUrl: 'http://option-url.com' }
    request.query['select-type'] = 'QueryDerived'
    request.query['report-title'] = 'Query Derived Title'
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'QueryDerived', 'Query Derived Title', 'http://option-url.com', 'Query Derived Title')
  })

  test('uses reportsUrl from options when provided', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title', reportsUrl: '/download-report-list' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    const result = await handler(request, h)
    expect(h.view).toHaveBeenCalledWith('report-loading/report-loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: 'Option Title',
      reportUrl: 'http://options.url',
      reportsUrl: '/download-report-list'
    })
    expect(result).toBe('view-result')
  })

  test('sets no-results status when queryTrackingApi returns null', async () => {
    queryTrackingApi.mockResolvedValue(null)
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, {})
    await handler(request, h)
    await Promise.resolve()
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', { status: 'no-results' })
  })

  test('sets no-results status when queryTrackingApi returns empty string', async () => {
    queryTrackingApi.mockResolvedValue('')
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, {})
    await handler(request, h)
    await Promise.resolve()
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', { status: 'no-results' })
  })

  test('sets no-results status when error has a 404 status code', async () => {
    const notFoundError = new Error('not found')
    notFoundError.output = { statusCode: 404 }
    queryTrackingApi.mockRejectedValue(notFoundError)
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, {})
    await handler(request, h)
    await Promise.resolve()
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', { status: 'no-results' })
    expect(console.error).not.toHaveBeenCalled()
  })

  test('uses query scheme-name as schemeName when options.schemeName not set', async () => {
    request.query['scheme-name'] = 'SchemeName From Query'
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', expect.objectContaining({
      schemeName: 'SchemeName From Query'
    }))
  })

  test('uses query.schemeName as schemeName fallback', async () => {
    request.query.schemeName = 'SchemeName Property'
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', expect.objectContaining({
      schemeName: 'SchemeName Property'
    }))
  })

  test('uses query.scheme as schemeName fallback', async () => {
    request.query.scheme = 'Scheme Property'
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await handler(request, h)
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', expect.objectContaining({
      schemeName: 'Scheme Property'
    }))
  })
})
