jest.mock('../../../../app/api')
const { get } = require('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/hold/read-file-content.js')
const cheerio = require('cheerio')
const { holdAdmin } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
const url = '/payment-holds'
const pageH1 = 'Payment holds'
let auth

describe('Payment holds', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('/payment-holds page', () => {
    const mockPaymentHolds = [
      {
        holdId: 1,
        frn: '1234567890',
        holdCategoryName: 'Outstanding debt',
        holdCategorySchemeId: 1,
        holdCategorySchemeName: 'SFI23',
        dateTimeAdded: '2021-08-26T13:29:28.949Z',
        dateTimeClosed: null
      },
      {
        holdId: 4,
        frn: '1111111111',
        holdCategoryName: 'Outstanding debt',
        holdCategorySchemeId: 1,
        holdCategorySchemeName: 'SFI23',
        dateTimeAdded: '2021-09-14T22:35:28.885Z',
        dateTimeClosed: '2021-09-14T22:41:44.659Z'
      }
    ]

    function mockGetPaymentHold (paymentHolds) {
      get.mockResolvedValue({ payload: { paymentHolds } })
    }

    function expectRequestForPaymentHold (timesCalled = 1) {
      expect(get).toHaveBeenCalledTimes(timesCalled)
      expect(get).toHaveBeenCalledWith('/payment-holds')
    }
    const method = 'GET'

    test('returns 200 and no hold categories when no categories returned in response', async () => {
      mockGetPaymentHold([])

      const res = await server.inject({ method, url, auth })

      expectRequestForPaymentHold()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('#no-hold-text').text()).toEqual('There are no payment holds.')
    })

    test('returns 403 no viewPaymentHolds permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 no auth', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })

    test('returns 200 and correctly lists returned hold category', async () => {
      mockGetPaymentHold(mockPaymentHolds)

      const res = await server.inject({ method, url, auth })

      expectRequestForPaymentHold()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const holds = $('.govuk-table__body tr')
      expect(holds.length).toEqual(1)
      holds.each((i, hold) => {
        const holdCells = $('td', hold)
        expect(holdCells.eq(0).text()).toEqual(mockPaymentHolds[i].frn)
        expect(holdCells.eq(1).text()).toEqual(mockPaymentHolds[i].holdCategoryName)
        expect(holdCells.eq(2).text()).toEqual(mockPaymentHolds[i].holdCategorySchemeName)
        expect(holdCells.eq(3).text()).toEqual(mockPaymentHolds[i].dateTimeAdded)
      })
    })

    test('returns 200 and correctly lists scheme name as SFI22 if passed in name is SFI', async () => {
      mockPaymentHolds[0].holdCategorySchemeName = 'SFI'
      mockPaymentHolds[1].holdCategorySchemeName = 'SFI'
      mockGetPaymentHold(mockPaymentHolds)

      const res = await server.inject({ method, url, auth })

      expectRequestForPaymentHold()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const holds = $('.govuk-table__body tr')
      expect(holds.length).toEqual(1)
      holds.each((i, hold) => {
        const holdCells = $('td', hold)
        expect(holdCells.eq(2).text()).toEqual('SFI22')
      })
    })

    test('/remove-payment-hold returns 302 and redirects to /', async () => {
      const mockForCrumbs = () => mockGetPaymentHold(mockPaymentHolds)
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const res = await server.inject({
        method: 'POST',
        url: '/remove-payment-hold',
        auth,
        payload: { crumb: viewCrumb, holdId: '1' },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/')
    })
  })

  describe('GET payment-holds/bulk/add page', () => {
    const method = 'GET'
    const url = '/payment-holds/bulk/add'
    const pageH1 = 'Bulk add payment holds'

    const mockPaymentHoldCategories = [{
      holdCategoryId: 123,
      name: 'my hold category',
      schemeName: 'schemeName'
    }]

    const mockGetPaymentHoldCategories = (paymentHoldCategories) => {
      get.mockResolvedValue({ payload: { paymentHoldCategories } })
    }

    const expectRequestForPaymentHoldCategories = (timesCalled = 1) => {
      expect(get).toHaveBeenCalledTimes(timesCalled)
      expect(get).toHaveBeenCalledWith('/payment-hold-categories')
    }

    test('returns 200 when load successful', async () => {
      mockGetPaymentHoldCategories(mockPaymentHoldCategories)
      const res = await server.inject({ method, url, auth })

      expectRequestForPaymentHoldCategories()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
    })

    test('returns 200 when load successful even if no hold categories', async () => {
      mockGetPaymentHoldCategories([])
      const res = await server.inject({ method, url, auth })

      expectRequestForPaymentHoldCategories()
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
    })

    test('returns 403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 no auth', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })
  })

  describe('GET payment-holds/bulk/remove page', () => {
    const method = 'GET'
    const url = '/payment-holds/bulk/remove'
    const pageH1 = 'Bulk remove payment holds'

    test('returns 200 when load successful', async () => {
      const res = await server.inject({ method, url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
    })

    test('returns 403 if no permission', async () => {
      auth.credentials.scope = []
      const res = await server.inject({ method, url, auth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 no auth', async () => {
      const res = await server.inject({ method, url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })
  })
})
