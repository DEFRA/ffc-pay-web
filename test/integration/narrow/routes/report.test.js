const {
  schemeAdmin,
  holdAdmin,
  dataView
} = require('../../../../app/auth/permissions')
const { getHolds } = require('../../../../app/holds')
const api = require('../../../../app/api')
const { getMIReport, getSuppressedReport } = require('../../../../app/storage')
const { getSchemes } = require('../../../../app/helpers/get-schemes')
const createServer = require('../../../../app/server')
const cheerio = require('cheerio')

let mockDownload
jest.mock('../../../../app/auth')
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
jest.mock('../../../../app/holds')
jest.mock('../../../../app/api')
jest.mock('../../../../app/storage')
jest.mock('../../../../app/helpers/get-schemes')

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

  test('GET /report-list/holds returns stream if report available', async () => {
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
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toContain('123')
  })

  test('GET /report-list/transaction-summary renders with schemes', async () => {
    getSchemes.mockResolvedValue([{ name: 'Scheme A' }, { name: 'Scheme B' }])

    const options = {
      method: 'GET',
      url: '/report-list/transaction-summary',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain('Scheme A')
    expect(response.payload).toContain('Scheme B')
  })

  test('GET /report-list/transaction-summary/download returns CSV', async () => {
    api.getTrackingData = jest.fn().mockResolvedValue({
      payload: {
        reportData: [
          {
            correlationId: '123',
            frn: '1234567890',
            claimNumber: 'CN123',
            agreementNumber: 'AN123',
            revenueOrCapital: 'Revenue',
            year: 2023,
            invoiceNumber: 'INV123',
            currency: 'GBP',
            paymentRequestNumber: 'PR123',
            value: 1000,
            batch: 'Batch1',
            sourceSystem: 'System1',
            batchExportDate: '2024-01-01',
            routedToRequestEditor: false,
            deltaAmount: 50,
            apValue: 100,
            arValue: 50,
            debtType: 'Admin',
            status: 'Completed',
            lastUpdated: '2024-01-02'
          }
        ]
      }
    })

    const options = {
      method: 'GET',
      url: '/report-list/transaction-summary/download?schemeId=1&year=2023&revenueOrCapital=Revenue',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toContain('123')
  })

  test('GET /report-list/transaction-summary/download shows error when no data', async () => {
    api.getTrackingData.mockResolvedValue({
      payload: {
        reportData: []
      }
    })

    const options = {
      method: 'GET',
      url: '/report-list/transaction-summary/download?schemeId=1&year=2023',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain(
      'No data available for the selected filters'
    )
  })

  test('GET /report-list/claim-level-report renders with schemes', async () => {
    getSchemes.mockResolvedValue([{ name: 'Scheme C' }])

    const options = {
      method: 'GET',
      url: '/report-list/claim-level-report',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain('Scheme C')
  })

  test('GET /report-list/claim-level-report/download returns CSV', async () => {
    api.getTrackingData.mockResolvedValue({
      payload: {
        claimLevelReportData: [
          { frn: '789', claimNumber: '123', status: 'Completed' }
        ]
      }
    })

    const options = {
      method: 'GET',
      url: '/report-list/claim-level-report/download?schemeId=1&year=2023',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toContain('789')
  })

  test('GET /report-list/request-editor-report returns CSV if data available', async () => {
    api.getTrackingData.mockResolvedValue({
      payload: {
        reReportData: [{ frn: '123', claimNumber: '456', enriched: true }]
      }
    })

    const options = {
      method: 'GET',
      url: '/report-list/request-editor-report',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(response.payload).toContain('123')
  })

  test('GET /report-list/request-editor-report returns unavailable page if no data', async () => {
    api.getTrackingData.mockResolvedValue({})

    const options = {
      method: 'GET',
      url: '/report-list/request-editor-report',
      auth
    }
    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain(
      '<h1 class="govuk-heading-l">Payment report unavailable</h1>'
    )
  })

  test('GET /report-list/claim-level-report/download shows error when no data', async () => {
    api.getTrackingData.mockResolvedValue({
      payload: {
        claimLevelReportData: []
      }
    })

    const options = {
      method: 'GET',
      url: '/report-list/claim-level-report/download?schemeId=1&year=2023',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain(
      'No data available for the selected filters'
    )
  })

  test('Validation error renders with validation messages', async () => {
    const options = {
      method: 'GET',
      url: '/report-list/transaction-summary/download',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(400)
    const $ = cheerio.load(response.payload)
    expect($('h2').text()).toContain('There is a problem')
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
})
