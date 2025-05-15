const {
  schemeAdmin,
  holdAdmin,
  dataView
} = require('../../../../../app/auth/permissions')
const { getHolds } = require('../../../../../app/holds')
const { getMIReport, getSuppressedReport } = require('../../../../../app/storage')
const createServer = require('../../../../../app/server')

let mockDownload
jest.mock('../../../../../app/auth')
jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockImplementation(() => {
        return {
          getContainerClient: jest.fn().mockImplementation(() => {
            return {
              createIfNotExists: jest.fn(),
              getBlockBlobClient: jest.fn().mockImplementation(() => {
                return {
                  download: mockDownload
                }
              })
            }
          })
        }
      })
    }
  }
})
jest.mock('../../../../../app/holds')
jest.mock('../../../../../app/api')
jest.mock('../../../../../app/storage')
jest.mock('../../../../../app/helpers/get-schemes')

describe('Report test', () => {
  let server
  let auth

  beforeEach(async () => {
    mockDownload = jest.fn().mockReturnValue({
      readableStreamBody: 'Hello'
    })
    auth = {
      strategy: 'session-auth',
      credentials: { scope: [schemeAdmin, holdAdmin, dataView] }
    }
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
    jest.clearAllMocks()
  })

  test('GET /report-list/payment-requests returns stream if report available', async () => {
    getMIReport.mockResolvedValue({
      readableStreamBody: 'Hello'
    })

    const options = {
      method: 'GET',
      url: '/report-list/payment-requests',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toBe('Hello')
  })

  test('GET /report-list/suppressed-payments returns stream if report available', async () => {
    getSuppressedReport.mockResolvedValue({
      readableStreamBody: 'Hello'
    })

    const options = {
      method: 'GET',
      url: '/report-list/suppressed-payments',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toBe('Hello')
  })

  test('GET /report-list/holds returns view if report available', async () => {
    getHolds.mockResolvedValue([
      {
        frn: '123',
        holdCategorySchemeName: 'Scheme 1',
        holdCategoryName: 'Category 1',
        dateTimeAdded: new Date()
      }
    ])

    const options = {
      method: 'GET',
      url: '/report-list/holds',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(response.payload).toContain('123')
  })

  test('GET /report-unavailable renders unavailable page', async () => {
    const options = {
      method: 'GET',
      url: '/report-unavailable',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain(
      '<h1 class="govuk-heading-l">Report unavailable</h1>'
    )
  })

  test('GET /report-list/holds returns unavailable page if no holds', async () => {
    getHolds.mockResolvedValue([])

    const options = {
      method: 'GET',
      url: '/report-list/holds',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain('There are currently no holds.')
  })

  test('GET /report-list/transaction-summary/download returns error for invalid query params', async () => {
    const options = {
      method: 'GET',
      url: '/report-list/transaction-summary/download?schemeId=invalid&year=2023',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(400)
    expect(response.payload).toContain('There is a problem')
  })

  test('GET /report-list/payment-requests returns correct content type', async () => {
    getMIReport.mockResolvedValue({
      readableStreamBody: 'Hello'
    })

    const options = {
      method: 'GET',
      url: '/report-list/payment-requests',
      auth
    }

    const response = await server.inject(options)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
  })

  test('GET /report-list/payment-requests returns 403 for unauthorized role', async () => {
    const unauthorizedAuth = {
      strategy: 'session-auth',
      credentials: { scope: [] }
    }

    const options = {
      method: 'GET',
      url: '/report-list/payment-requests',
      auth: unauthorizedAuth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(403)
    expect(response.payload).toContain('Sorry, you are not authorised to perform this action')
  })
})
