jest.mock('../../../../app/auth')
const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
jest.mock('../../../../app/api')
const { getProcessingData } = require('../../../../app/api')
const { schemeAdmin } = require('../../../../app/auth/permissions')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
const url = '/payment-schemes'
const pageH1 = 'Schemes'
let auth

describe('Payment schemes', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    auth = { strategy: 'session-auth', credentials: { scope: [schemeAdmin] } }
    server = await createServer()
  })

  afterEach(async () => { await server.stop() })

  const mockPaymentSchemes = [
    { schemeId: '1', name: 'SFI - active', active: true },
    { schemeId: '2', name: 'SFI - inactive', active: false }
  ]

  const mockGetPaymentSchemes = (paymentSchemes) => {
    getProcessingData.mockResolvedValueOnce({ payload: { paymentSchemes } })
  }

  const expectRequestForPaymentSchemes = (timesCalled = 1) => {
    expect(getProcessingData).toHaveBeenCalledTimes(timesCalled)
    expect(getProcessingData).toHaveBeenCalledWith('/payment-schemes')
  }

  describe('GET requests', () => {
    const method = 'GET'

    test.each([
      { holdResponse: null },
      { holdResponse: undefined },
      { holdResponse: '' },
      { holdResponse: 0 },
      { holdResponse: false }
    ])('returns 500 and error view when falsy value returned from getting payment schemes', async ({ holdResponse }) => {
      getProcessingData.mockResolvedValueOnce(holdResponse)
      const res = await server.inject({ method, url, auth })
      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(500)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual('Sorry, there is a problem with the service')
    })

    test('returns 200 and no schemes when none are returned', async () => {
      mockGetPaymentSchemes([])
      const res = await server.inject({ method, url, auth })
      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('.govuk-body').text()).toEqual('No available schemes')
    })

    test('returns 200 and lists schemes correctly', async () => {
      mockGetPaymentSchemes(mockPaymentSchemes)
      const res = await server.inject({ method, url, auth })
      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const schemes = $('tbody tr.govuk-table__row')
      expect(schemes.length).toEqual(mockPaymentSchemes.length)
      schemes.each((i, scheme) => {
        const cells = $('td', scheme)
        expect(cells.eq(0).text()).toEqual(mockPaymentSchemes[i].name)
        expect(cells.eq(1).text()).toEqual(mockPaymentSchemes[i].active ? 'Active' : 'Inactive')
      })
    })

    test('/post returns 302 and redirects to update-payment-scheme', async () => {
      const mockForCrumbs = () => mockGetPaymentSchemes(mockPaymentSchemes)
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const res = await server.inject({
        method: 'POST',
        url,
        auth,
        payload: { crumb: viewCrumb, schemeId: '1', active: 'true', name: 'SFI' },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/update-payment-scheme?schemeId=1&active=true&name=SFI')
    })

    test('/update-payment-scheme get returns 200 and update scheme view', async () => {
      const res = await server.inject({ method, url: '/update-payment-scheme?schemeId=1&active=true&name=SFI', auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toContain('Would you like to disable SFI?')
    })

    test('/update-payment-scheme post returns 302 and redirects to payment-schemes', async () => {
      const mockForCrumbs = () => mockGetPaymentSchemes(mockPaymentSchemes)
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const res = await server.inject({
        method: 'POST',
        url: '/update-payment-scheme',
        auth,
        payload: { crumb: viewCrumb, schemeId: '1', active: 'true', name: 'SFI', confirm: 'true' },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/payment-schemes')
    })

    test.each([
      { authOverride: { strategy: 'session-auth', credentials: { scope: [] } }, expectedStatus: 403, redirect: null },
      { authOverride: { strategy: 'session-auth', credentials: {} }, expectedStatus: 403, redirect: null }
    ])('handles permission/auth checks', async ({ authOverride, expectedStatus, redirect }) => {
      mockGetPaymentSchemes(mockPaymentSchemes)

      const res = await server.inject({ method, url, auth: authOverride })

      expect(res.statusCode).toBe(expectedStatus)
      if (redirect) {
        expect(res.headers.location).toBe(redirect)
      }
    })
  })
})
