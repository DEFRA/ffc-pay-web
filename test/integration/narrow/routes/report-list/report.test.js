const { schemeAdmin, holdAdmin, dataView } = require('../../../../../app/auth/permissions')
const { getHolds } = require('../../../../../app/holds')
const { getMIReport, getSuppressedReport } = require('../../../../../app/storage')
const createServer = require('../../../../../app/server')

let mockDownload
jest.mock('../../../../../app/auth')
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: { fromConnectionString: jest.fn(() => ({ getContainerClient: jest.fn(() => ({ createIfNotExists: jest.fn(), getBlockBlobClient: jest.fn(() => ({ download: mockDownload })) })) })) }
}))
jest.mock('../../../../../app/holds')
jest.mock('../../../../../app/api')
jest.mock('../../../../../app/storage/pay-reports')
jest.mock('../../../../../app/helpers/get-schemes')

describe('Report Routes', () => {
  let server
  const auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin, holdAdmin, dataView] } }

  beforeEach(async () => {
    mockDownload = jest.fn().mockReturnValue({ readableStreamBody: 'Hello' })
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => { await server.stop(); jest.clearAllMocks() })

  const injectRoute = (url, credentials = auth) => server.inject({ method: 'GET', url, auth: credentials })

  test.each([
    ['/report-list/payment-requests', getMIReport],
    ['/report-list/suppressed-payments', getSuppressedReport]
  ])('GET %s returns stream', async (url, mockFn) => {
    mockFn.mockResolvedValue({ readableStreamBody: 'Hello' })
    const res = await injectRoute(url)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toBe('Hello')
  })

  test('GET /report-list/holds returns CSV view', async () => {
    getHolds.mockResolvedValue([{ frn: '123', holdCategorySchemeName: 'Scheme 1', marketingYear: 2023, agreementNumber: 'AG123', contractNumber: 'CON123', holdCategoryName: 'Category 1', dateTimeAdded: new Date() }])
    const res = await injectRoute('/report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toContain('123')
  })

  test('GET /report-unavailable renders unavailable page', async () => {
    const res = await injectRoute('/report-unavailable')
    expect(res.statusCode).toBe(200)
    expect(res.payload).toContain('<h1 class="govuk-heading-l">Report unavailable</h1>')
  })

  test('GET /report-list/holds returns unavailable page if no holds', async () => {
    getHolds.mockResolvedValue([])
    const res = await injectRoute('/report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.payload).toContain('There are currently no holds.')
  })

  test('GET /report-list/transaction-summary/download returns 400 for invalid params', async () => {
    const res = await injectRoute('/report-list/transaction-summary/download?schemeId=invalid&year=2023')
    expect(res.statusCode).toBe(400)
    expect(res.payload).toContain('There is a problem')
  })

  test('GET /report-list/payment-requests returns 403 for unauthorized', async () => {
    const res = await injectRoute('/report-list/payment-requests', { strategy: 'session-auth', credentials: { scope: [] } })
    expect(res.statusCode).toBe(403)
    expect(res.payload).toContain('Sorry, you are not authorised to perform this action')
  })

  test('GET /report-list/holds handles default values', async () => {
    getHolds.mockResolvedValue([{ frn: '456', holdCategorySchemeName: 'Scheme 2', marketingYear: undefined, agreementNumber: undefined, contractNumber: undefined, holdCategoryName: 'Category 2', dateTimeAdded: new Date() }])
    const res = await injectRoute('/report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toContain('All')
  })
})
