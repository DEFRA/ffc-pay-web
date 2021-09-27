const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
const getCrumbs = require('../../../helpers/get-crumbs')

describe('Payment schemes', () => {
  let server
  const url = '/payment-schemes'
  const pageH1 = 'Payment Schemes'

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  jest.mock('../../../../app/payment-holds')
  const { getResponse, postRequest } = require('../../../../app/payment-holds')

  const paymentSchemes = [
    {
      schemeId: '1',
      name: 'SFI - active',
      active: true
    },
    {
      schemeId: '2',
      name: 'SFI - inactive',
      active: false
    }
  ]

  function mockGetPaymentSchemes (paymentSchemes) {
    getResponse.mockResolvedValueOnce({ payload: { paymentSchemes } })
  }

  function expectRequestForPaymentSchemes (timesCalled = 1) {
    expect(getResponse).toHaveBeenCalledTimes(timesCalled)
    expect(getResponse).toHaveBeenCalledWith('/payment-schemes')
  }

  describe('GET requests', () => {
    const method = 'GET'

    test.each([
      { holdResponse: null },
      { holdResponse: undefined },
      { holdResponse: '' },
      { holdResponse: 0 },
      { holdResponse: false }
    ])('returns 500 and no response view when falsy value returned from getting payment schemes', async ({ holdResponse }) => {
      getResponse.mockResolvedValueOnce(holdResponse)

      const res = await server.inject({ method, url })

      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(500)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual('Sorry, there is a problem with the service')
      expect($('.govuk-body').text()).toEqual('Try again later.')
    })

    test('returns 200 and no schemes when non are returned', async () => {
      mockGetPaymentSchemes([])

      const res = await server.inject({ method, url })

      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const content = $('.govuk-body').text()
      expect(content).toEqual('No Schemes found!')
    })

    test('returns 200 and correctly lists returned payment schemes', async () => {
      mockGetPaymentSchemes(paymentSchemes)

      const res = await server.inject({ method, url })

      expectRequestForPaymentSchemes()
      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const schemes = $('tbody tr.govuk-table__row')
      expect(schemes.length).toEqual(paymentSchemes.length)
      schemes.each((i, scheme) => {
        const schemeCells = $('td', scheme)
        expect(schemeCells.eq(0).text()).toEqual(paymentSchemes[i].schemeId)
        expect(schemeCells.eq(1).text()).toEqual(paymentSchemes[i].name)
        expect(schemeCells.eq(2).text()).toEqual(paymentSchemes[i].active ? 'Active' : 'Not Active')
        expect(schemeCells.eq(3).text()).toMatch('Update')
      })
    })
  })
})
