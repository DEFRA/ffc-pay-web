jest.mock('../../../../app/config', () => {
  const actualConfig = jest.requireActual('../../../../app/config')
  return {
    ...actualConfig,
    useV2Events: true
  }
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
    const pageH1 = 'Monitoring'

    test('returns 200 when schemes load successfully', async () => {
      mockGetSchemes(mockSchemes)
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('#schemeId').children().length).toBe(mockSchemes.length)
    })

    test('returns 200 and shows "No schemes were found." if no schemes', async () => {
      mockGetSchemes([])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('#no-schemes').text()).toEqual('No schemes were found.')
    })

    test('returns 403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 and redirects to login if not authenticated', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })
  })

  describe('GET /monitoring/view-processed-payment-requests', () => {
    const method = 'GET'
    const url = '/monitoring/view-processed-payment-requests?schemeId=1'
    const pageH1 = 'Processed payment requests'

    const mockGetProcessedPayments = () => {
      getPaymentsByScheme.mockResolvedValue(mockProcessedPayments)
    }

    test('returns 200 when processed payments load successfully', async () => {
      mockGetProcessedPayments()
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('caption').text()).toEqual(pageH1)
      expect($('tbody').children().length).toBe(mockProcessedPayments.length)
    })

    test('returns 200 and shows "No processed payment requests found." if no processed payments', async () => {
      getPaymentsByScheme.mockResolvedValue([])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('#no-hold-text').text()).toEqual('No processed payment requests found.')
    })

    test('returns 403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 and redirects to login if not authenticated', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })

    test('returns 412 and shows error message if processing fails', async () => {
      getPaymentsByScheme.mockRejectedValue(new Error('Failed to load processed payments'))
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(412)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-error-summary__title').text().trim()).toEqual('There is a problem')
      expect($('.govuk-error-message').text()).toContain('Error: Failed to load processed payments')
    })

    test('returns 200 and ignores unknown fields in processed payments', async () => {
      getPaymentsByScheme.mockResolvedValue([
        { scheme: 'Extra Scheme', paymentRequests: 1, value: '£10.00', extra: 'ignored' }
      ])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('tbody').children().length).toBe(1)
    })

    test('returns 200 and handles empty schemeId gracefully', async () => {
      getPaymentsByScheme.mockResolvedValue([])
      const res = await server.inject({
        method,
        url: '/monitoring/view-processed-payment-requests?schemeId=',
        auth
      })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('#no-hold-text').text()).toContain('No processed payment requests found.')
    })

    test('returns 200 and shows no results for invalid schemeId', async () => {
      getPaymentsByScheme.mockResolvedValue([])
      const res = await server.inject({
        method,
        url: '/monitoring/view-processed-payment-requests?schemeId=999',
        auth
      })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('#no-hold-text').text()).toContain('No processed payment requests found.')
    })

    describe('when useV2Events is false', () => {
      beforeAll(() => {
        jest.resetModules()
        jest.mock('../../../../app/config', () => {
          const actualConfig = jest.requireActual('../../../../app/config')
          return {
            ...actualConfig,
            useV2Events: false
          }
        })
      })

      beforeEach(async () => {
        server = await createServer()
      })

      afterEach(async () => {
        await server.stop()
      })

      test('logs a warning when useV2Events is false', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        const res = await server.inject({
          method: 'GET',
          url: '/monitoring/view-processed-payment-requests?schemeId=1',
          auth
        })

        expect(res.statusCode).toBe(404)
        expect(warnSpy).toHaveBeenCalledWith(
          'V2 events are not enabled, cannot view processed payment requests'
        )

        warnSpy.mockRestore()
      })

      test('returns 404 Not Found view', async () => {
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(404)
        const $ = cheerio.load(res.payload)
        expect($('h1').text().trim()).toEqual('Page not found')
      })

      test('returns 404 Not Found view when no query string provided', async () => {
        const res = await server.inject({
          method,
          url: '/monitoring/view-processed-payment-requests',
          auth
        })
        expect(res.statusCode).toBe(404)
        const $ = cheerio.load(res.payload)
        expect($('h1').text().trim()).toEqual('Page not found')
      })
    })
  })
})
