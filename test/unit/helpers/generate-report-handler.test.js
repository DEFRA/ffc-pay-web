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
    jest.clearAllMocks()
    uuid.v4.mockReturnValue('job-1234')
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

  const expectCommonFlow = async (handler, expectedReportType, expectedTitle, expectedUrl) => {
    const result = await handler(request, h)
    expect(uuid.v4).toHaveBeenCalled()
    expect(normaliseQuery).toHaveBeenCalledWith(request.query)
    expect(buildReportUrl).toHaveBeenCalledWith(expectedReportType, { normalized: true })
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'pending',
      reportType: expectedReportType
    })
    expect(h.view).toHaveBeenCalledWith('report-list/report-loading', {
      jobId: 'job-1234',
      reportTitle: expectedTitle,
      reportUrl: expectedUrl
    })
    expect(result).toBe('view-result')
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, 'job-1234', {
      status: 'download',
      reportType: expectedReportType,
      returnedFilename: 'valid.json',
      reportFilename: 'final.csv'
    })
  }

  test('uses options values when provided and reportType from parameter', async () => {
    options = { reportUrl: 'http://options.url', reportTitle: 'Option Title' }
    const handler = generateReportHandler('ParamReport', generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'ParamReport', 'Option Title', 'http://options.url')
  })

  test('falls back on query values when options not provided and reportType from query', async () => {
    options = {}
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'QReport', 'Query Title', 'http://query.url')
  })

  test('throws error if returned filename is invalid and sets status to failed', async () => {
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

  test('handles undefined reportType parameter and falls back to query values', async () => {
    options = { reportUrl: 'http://option-url.com' }
    request.query['select-type'] = 'QueryDerived'
    request.query['report-title'] = 'Query Derived Title'
    const handler = generateReportHandler(undefined, generateFinalFilenameFunc, options)
    await expectCommonFlow(handler, 'QueryDerived', 'Query Derived Title', 'http://option-url.com')
  })
})
