const createServer = require('../../../../app/server')

const { downloadReportTypes } = require('../../../../app/helpers/download-report-types')
const { generateReportTypes } = require('../../../../app/helpers/generate-report-types')
const { getReportFileInfo } = require('../../../../app/helpers/get-report-file-info')

const { schemeAdmin } = require('../../../../app/auth/permissions')
const { getHolds } = require('../../../../app/holds')

jest.mock('../../../../app/auth')
jest.mock('../../../../app/holds')
jest.mock('../../../../app/storage/pay-reports')
jest.mock('../../../../app/storage/doc-reports')

let auth
let server

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
  server = await createServer()
  getHolds.mockResolvedValue(new Array(10))
})

afterEach(async () => {
  await server.stop()
})

describe('GET /download-report-list', () => {
  test('returns download report types view model', async () => {
    const reportTypes = downloadReportTypes()
    const reportTypesKeys = Object.keys(reportTypes)

    const response = await server.inject({ method: 'GET', url: '/download-report-list', auth })
    const viewModel = response.request.response.source.context

    expect(viewModel.totalHolds).toEqual(10)
    expect(viewModel.reportTypes).toEqual(reportTypesKeys)
    expect(viewModel.reportTypesRoutes).toEqual(reportTypes)
    expect(viewModel.generateReportTypes).toEqual(Object.keys(generateReportTypes()))
    expect(viewModel.generateReportTypesRoutes).toEqual(generateReportTypes())
    expect(viewModel.fileInfo).toEqual(getReportFileInfo())
    expect(viewModel.totalReportTypes).toEqual(reportTypesKeys.length)
  })

  test('hides holds link when no holds exist', async () => {
    getHolds.mockResolvedValue([])
    const response = await server.inject({ method: 'GET', url: '/download-report-list', auth })
    expect(response.statusCode).toBe(200)
    expect(response.payload).not.toContain('/download-report-list/holds')
  })
})

describe('GET /generate-report-list', () => {
  test('returns generate report types view model', async () => {
    const reportTypes = generateReportTypes()
    const reportTypesKeys = Object.keys(reportTypes)

    const response = await server.inject({ method: 'GET', url: '/generate-report-list', auth })
    const viewModel = response.request.response.source.context

    expect(viewModel.reportTypes).toEqual(reportTypesKeys)
    expect(viewModel.reportTypesRoutes).toEqual(reportTypes)
    expect(viewModel.totalReportTypes).toEqual(reportTypesKeys.length)
  })
})
