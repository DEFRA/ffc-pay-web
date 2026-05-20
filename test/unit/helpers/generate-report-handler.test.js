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

  const expectCommonFlow = async (handler, expectedReportType, expectedTitle, expectedUrl) => {
    const result = await handler(request, h)
    expect(randomUUID).toHaveBeenCalled()
    expect(normaliseQuery).toHaveBeenCalledWith(request.query)
    expect(buildReportUrl).toHaveBeenCalledWith(expectedReportType, { normalized: true })
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', {
      status: 'pending',
      reportType: expectedReportType
    })
    expect(h.view).toHaveBeenCalledWith('report-list/report-loading', {
      jobId: '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c',
      reportTitle: expectedTitle,
      reportUrl: expectedUrl
    })
    expect(result).toBe('view-result')
    await Promise.resolve()
    expect(queryTrackingApi).toHaveBeenCalledWith('http://built.url')
    expect(setReportStatus).toHaveBeenCalledWith(request, '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c', {
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
    await expectCommonFlow(handler, 'QueryDerived', 'Query Derived Title', 'http://option-url.com')
  })
})
