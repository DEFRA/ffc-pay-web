const { schemeAdmin } = require('../../../../app/auth/permissions')
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
const { getHolds } = require('../../../../app/holds')

describe('Report test', () => {
  const createServer = require('../../../../app/server')
  let server
  let auth

  beforeEach(async () => {
    mockDownload = jest.fn().mockReturnValue({
      readableStreamBody: 'Hello'
    })

    auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
    jest.clearAllMocks()
  })

  test('GET /report/payment-requests route returns stream if report available', async () => {
    const options = {
      method: 'GET',
      url: '/report/payment-requests',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toBe('Hello')
  })

  test('GET /report/transaction-summary route returns stream if report available', async () => {
    const options = {
      method: 'GET',
      url: '/report/transaction-summary',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toBe('Hello')
  })

  test('GET /report/suppressed-payments route returns stream if report available', async () => {
    const options = {
      method: 'GET',
      url: '/report/suppressed-payments',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toBe('Hello')
  })

  test('GET /report/holds route returns stream if report available', async () => {
    getHolds.mockReturnValue([{
      holdId: 1,
      frn: '123',
      holdCategorySchemeName: 'Scheme 1',
      holdCategorySchemeId: 2,
      holdCategoryName: 'Category 1',
      dateTimeAdded: new Date()
    }])

    const options = {
      method: 'GET',
      url: '/report/holds',
      auth
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
  })

  test('GET /report/payment-requests route returns unavailable page if report not available', async () => {
    mockDownload = undefined
    const options = {
      method: 'GET',
      url: '/report/payment-requests',
      auth
    }

    const response = await server.inject(options)
    expect(response.payload).toContain('Payment report unavailable')
  })

  test('GET /report/transaction-summary route returns unavailable page if report not available', async () => {
    mockDownload = undefined
    const options = {
      method: 'GET',
      url: '/report/transaction-summary',
      auth
    }

    const response = await server.inject(options)
    expect(response.payload).toContain('Payment report unavailable')
  })

  test('GET /report/suppressed-payments route returns unavailable page if report not available', async () => {
    mockDownload = undefined
    const options = {
      method: 'GET',
      url: '/report/suppressed-payments',
      auth
    }

    const response = await server.inject(options)
    expect(response.payload).toContain('Payment report unavailable')
  })

  test('GET /report/holds route returns unavailable page if report not available', async () => {
    getHolds.mockReturnValue(undefined)
    const options = {
      method: 'GET',
      url: '/report/holds',
      auth
    }

    const response = await server.inject(options)
    expect(response.payload).toContain('Hold report unavailable')
  })

  afterEach(async () => {
    await server.stop()
  })
})
