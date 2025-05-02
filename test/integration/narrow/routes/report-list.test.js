const createServer = require('../../../../app/server')
const { getReportTypes } = require('../../../../app/constants/get-report-types')
const { schemeAdmin } = require('../../../../app/auth/permissions')
const { getHolds } = require('../../../../app/holds')

jest.mock('../../../../app/auth')
jest.mock('../../../../app/holds')

let auth
let server

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
  server = await createServer()
  getHolds.mockResolvedValue(10)
})

afterEach(async () => {
  await server.stop()
})

test('GET /report-list route returns report types', async () => {
  const reportTypes = getReportTypes()
  const reportTypesKeys = Object.keys(reportTypes)

  const options = {
    method: 'GET',
    url: '/report-list',
    auth
  }

  const response = await server.inject(options)
  const viewModel = response.request.response.source.context

  expect(viewModel.totalHolds).toEqual(10)
  expect(viewModel.reportTypes).toEqual(reportTypesKeys)
  expect(viewModel.reportTypesRoutes).toEqual(reportTypes)
  expect(viewModel.totalReportTypes).toEqual(reportTypesKeys.length)
})
