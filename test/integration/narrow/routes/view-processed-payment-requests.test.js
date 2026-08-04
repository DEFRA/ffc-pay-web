jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/payments/get-payments-by-scheme')

const cheerio = require('cheerio')
const { schemeAdmin, holdAdmin, dataView } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const { getProcessingData } = require('../../../../app/api')
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
  getProcessingData.mockResolvedValue({ payload: { paymentSchemes: schemes } })
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
    const pageH1 = 'View payment events by scheme'

    test('returns 200 when schemes load successfully', async () => {
      mockGetSchemes(mockSchemes)
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toContain(pageH1)
      expect($('#schemeId').children()).toHaveLength(mockSchemes.length + 1)
    })

    test('returns 200 and shows "No schemes were found." if no schemes', async () => {
      mockGetSchemes([])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toContain(pageH1)
      expect($('#no-schemes').text()).toContain('No schemes were found.')
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
    const pageH1 = 'Scheme payment event details'

    const mockGetProcessedPayments = () => {
      getPaymentsByScheme.mockResolvedValue(mockProcessedPayments)
    }

    test('returns 200 when processed payments load successfully', async () => {
      mockGetProcessedPayments()
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('caption').text()).toContain(pageH1)
      expect($('tbody').children()).toHaveLength(mockProcessedPayments.length)
    })

    test('returns 200 and shows "No processed payment requests found." if no processed payments', async () => {
      getPaymentsByScheme.mockResolvedValue([])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('#no-hold-text').text().replace(/\s+/g, ' '))
        .toContain('No data for this scheme. Return to View payment events by scheme and try again.')
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

    test('returns 200 and ignores unknown fields in processed payments', async () => {
      getPaymentsByScheme.mockResolvedValue([
        { scheme: 'Extra Scheme', paymentRequests: 1, value: '£10.00', extra: 'ignored' }
      ])
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('tbody').children()).toHaveLength(1)
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
      expect($('#no-hold-text').text().replace(/\s+/g, ' '))
        .toContain('No data for this scheme. Return to View payment events by scheme and try again.')
    })

    test('returns 412 and re-renders the schemes view with "Select a scheme" when schemeId is missing', async () => {
      mockGetSchemes(mockSchemes)
      const res = await server.inject({
        method,
        url: '/monitoring/view-processed-payment-requests',
        auth
      })
      expect(res.statusCode).toBe(412)
      expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
      expect(getPaymentsByScheme).not.toHaveBeenCalled()
      const $ = cheerio.load(res.payload)
      expect($('#schemeId-error').text()).toContain('Select a scheme')
      expect($('#schemeId').children()).toHaveLength(mockSchemes.length + 1)
    })

    test('returns 412 and re-renders the schemes view with "Select a scheme" when schemeId is an empty string', async () => {
      mockGetSchemes(mockSchemes)
      const res = await server.inject({
        method,
        url: '/monitoring/view-processed-payment-requests?schemeId=',
        auth
      })
      expect(res.statusCode).toBe(412)
      const $ = cheerio.load(res.payload)
      expect($('#schemeId-error').text()).toContain('Select a scheme')
    })

    describe('when getPaymentsByScheme throws', () => {
      test('returns 412 and shows the error message from a failed lookup with a payload message', async () => {
        mockGetSchemes(mockSchemes)
        getPaymentsByScheme.mockRejectedValue({ data: { payload: { message: 'Scheme not found' } } })
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(412)
        const $ = cheerio.load(res.payload)
        expect($('#schemeId-error').text()).toContain('Scheme not found')
      })

      test('returns 412 and falls back to err.message when no payload message is present', async () => {
        mockGetSchemes(mockSchemes)
        getPaymentsByScheme.mockRejectedValue(new Error('Network failure'))
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(412)
        const $ = cheerio.load(res.payload)
        expect($('#schemeId-error').text()).toContain('Network failure')
      })

      test('returns 412 and falls back to err.message when err.data exists but has no payload', async () => {
        mockGetSchemes(mockSchemes)
        getPaymentsByScheme.mockRejectedValue({ data: {}, message: 'Some other failure' })
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(412)
        const $ = cheerio.load(res.payload)
        expect($('#schemeId-error').text()).toContain('Some other failure')
      })

      test('re-fetches the scheme list from getProcessingData after the failure, to repopulate the dropdown', async () => {
        mockGetSchemes(mockSchemes)
        getPaymentsByScheme.mockRejectedValue(new Error('boom'))
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(412)
        expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
        expect(getProcessingData).toHaveBeenCalledTimes(1)
        const $ = cheerio.load(res.payload)
        expect($('#schemeId').children()).toHaveLength(mockSchemes.length + 1)
      })

      test('calls getPaymentsByScheme with the submitted schemeId before failing', async () => {
        mockGetSchemes(mockSchemes)
        getPaymentsByScheme.mockRejectedValue(new Error('boom'))
        const res = await server.inject({
          method,
          url: '/monitoring/view-processed-payment-requests?schemeId=2',
          auth
        })
        expect(res.statusCode).toBe(412)
        expect(getPaymentsByScheme).toHaveBeenCalledWith('2')
      })

      test('shows "No schemes were found." on the error path if the scheme re-fetch returns none', async () => {
        mockGetSchemes([])
        getPaymentsByScheme.mockRejectedValue(new Error('boom'))
        const res = await server.inject({ method, url, auth })
        expect(res.statusCode).toBe(412)
        const $ = cheerio.load(res.payload)
        expect($('#no-schemes').text()).toContain('No schemes were found.')
      })
    })
  })
})
