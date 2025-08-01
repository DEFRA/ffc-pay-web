jest.mock('../../../../app/config', () => {
  const actual = jest.requireActual('../../../../app/config')
  return { ...actual, useV2Events: true }
})
jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/payments/get-payments-by-scheme')

const cheerio = require('cheerio')
const { schemeAdmin, holdAdmin, dataView } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const { get } = require('../../../../app/api')
const { getPaymentsByScheme } = require('../../../../app/payments/get-payments-by-scheme')

let server
let auth

const mockSchemes = [
  { schemeId: '1', name: 'Scheme 1' },
  { schemeId: '2', name: 'Scheme 2' }
]

const mockProcessedPayments = [
  { scheme: 'Scheme 1', paymentRequests: 100, value: '£1,000.00' },
  { scheme: 'Scheme 2', paymentRequests: 50, value: '£500.00' }
]

const mockGetSchemes = (schemes) => {
  get.mockResolvedValue({ payload: { paymentSchemes: schemes } })
}

describe('Monitoring Schemes and Processed Payments', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin, holdAdmin, dataView] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET /monitoring/schemes', () => {
    const method = 'GET'
    const url = '/monitoring/schemes'

    test('200 when schemes load', async () => {
      mockGetSchemes(mockSchemes)
      const res = await server.inject({ method, url, auth })
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toContain('Monitoring')
      expect($('#schemeId').children().length).toBe(mockSchemes.length)
    })

    test('200 and "No schemes were found." if empty', async () => {
      mockGetSchemes([])
      const res = await server.inject({ method, url, auth })
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(200)
      expect($('#no-schemes').text()).toContain('No schemes were found.')
    })

    test('403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('302 to login if unauthenticated', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })
  })

  describe('GET /monitoring/view-processed-payment-requests', () => {
    const method = 'GET'
    const baseUrl = '/monitoring/view-processed-payment-requests'
    const fullUrl = `${baseUrl}?schemeId=1`

    const mockGetProcessed = () => {
      getPaymentsByScheme.mockResolvedValue(mockProcessedPayments)
    }

    test('200 when data loads successfully', async () => {
      mockGetProcessed()
      const res = await server.inject({ method, url: fullUrl, auth })
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(200)
      expect($('caption').text()).toContain('Processed payment requests')
      expect($('tbody tr').length).toBe(mockProcessedPayments.length)
    })

    test('200 and message if no data', async () => {
      getPaymentsByScheme.mockResolvedValue([])
      const res = await server.inject({ method, url: fullUrl, auth })
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(200)
      expect($('#no-hold-text').text()).toContain('No processed payment requests found.')
    })

    test('412 and error shown if processing fails', async () => {
      getPaymentsByScheme.mockRejectedValue(new Error('fail'))
      const res = await server.inject({ method, url: fullUrl, auth })
      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(412)
      expect($('.govuk-error-summary__title').text().trim()).toEqual('There is a problem')
      expect($('.govuk-error-message').text()).toContain('Error: fail')
    })

    test('403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url: fullUrl, auth })
      expect(res.statusCode).toBe(403)
    })

    test('302 to login if unauthenticated', async () => {
      const res = await server.inject({ method, url: fullUrl })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })

    test('412 if no schemeId in query', async () => {
      const res = await server.inject({ method, url: baseUrl, auth })
      expect(res.statusCode).toBe(412)
    })

    describe('when useV2Events is false', () => {
      let originalWarn
      beforeAll(() => {
        jest.resetModules()
        jest.mock('../../../../app/config', () => {
          const actual = jest.requireActual('../../../../app/config')
          return { ...actual, useV2Events: false }
        })
        originalWarn = console.warn
        console.warn = jest.fn()
      })

      afterAll(() => {
        console.warn = originalWarn
      })

      beforeEach(async () => {
        server = await createServer()
      })

      afterEach(async () => {
        await server.stop()
      })

      test('returns 404 and logs warning if feature disabled', async () => {
        const res = await server.inject({ method, url: fullUrl, auth })
        const $ = cheerio.load(res.payload)
        expect(res.statusCode).toBe(404)
        expect($('h1').text().trim()).toEqual('Page not found')
        expect(console.warn).toHaveBeenCalledWith(
          'V2 events are not enabled, cannot view processed payment requests'
        )
      })
    })
  })
})
