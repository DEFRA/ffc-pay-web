const { applicationAdmin, schemeAdmin, holdAdmin, dataView } = require('../../../../../app/auth/permissions')
const { getHolds } = require('../../../../../app/holds')
const { getSuppressedReport } = require('../../../../../app/storage/pay-reports')
const createServer = require('../../../../../app/server')

let mockDownload
jest.mock('../../../../../app/auth')
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: { fromConnectionString: jest.fn(() => ({ getContainerClient: jest.fn(() => ({ createIfNotExists: jest.fn(), getBlockBlobClient: jest.fn(() => ({ download: mockDownload })) })) })) }
}))
jest.mock('../../../../../app/holds')
jest.mock('../../../../../app/storage/pay-reports')
jest.mock('../../../../../app/storage/doc-reports')
jest.mock('../../../../../app/api')
jest.mock('../../../../../app/helpers/get-schemes')

let server
const auth = { strategy: 'session-auth', credentials: { scope: [applicationAdmin, schemeAdmin, holdAdmin, dataView] } }

const injectRoute = (url, credentials = auth) => server.inject({ method: 'GET', url, auth: credentials })

describe('Download Report List Routes', () => {
  beforeEach(async () => {
    mockDownload = jest.fn().mockReturnValue({ readableStreamBody: 'Hello' })
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => { await server.stop(); jest.clearAllMocks() })

  test('GET /download-report-list/suppressed-payments returns stream', async () => {
    getSuppressedReport.mockResolvedValue({ readableStreamBody: 'Hello' })
    const res = await injectRoute('/download-report-list/suppressed-payments')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toBe('Hello')
  })

  test('GET /download-report-list/holds returns CSV view', async () => {
    getHolds.mockResolvedValue([{ frn: '123', holdCategorySchemeName: 'Scheme 1', marketingYear: 2023, agreementNumber: 'AG123', contractNumber: 'CON123', holdCategoryName: 'Category 1', dateTimeAdded: new Date() }])
    const res = await injectRoute('/download-report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toContain('123')
  })

  test('GET /download-report-list/holds handles default values', async () => {
    getHolds.mockResolvedValue([{ frn: '456', holdCategorySchemeName: 'Scheme 2', marketingYear: undefined, agreementNumber: undefined, contractNumber: undefined, holdCategoryName: 'Category 2', dateTimeAdded: new Date() }])
    const res = await injectRoute('/download-report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.payload).toContain('All')
  })

  test('GET /download-report-list/suppressed-payments returns 403 for unauthorized', async () => {
    getSuppressedReport.mockResolvedValue({ readableStreamBody: 'Hello' })
    const res = await injectRoute('/download-report-list/suppressed-payments', { strategy: 'session-auth', credentials: { scope: [] } })
    expect(res.statusCode).toBe(403)
    expect(res.payload).toContain('Sorry, you are not authorised to perform this action')
  })

  test('GET /download-report-list/holds returns unavailable view when getHolds returns null', async () => {
    getHolds.mockResolvedValue(null)
    const res = await injectRoute('/download-report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.payload).toContain('Hold report unavailable')
  })

  test('GET /download-report-list/holds returns unavailable view when getHolds throws', async () => {
    getHolds.mockRejectedValue(new Error('DB error'))
    const res = await injectRoute('/download-report-list/holds')
    expect(res.statusCode).toBe(200)
    expect(res.payload).toContain('Hold report unavailable')
  })
})
