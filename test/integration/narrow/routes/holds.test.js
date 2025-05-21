jest.mock('../../../../app/api')
const { get } = require('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/hold/read-file-content.js')
const cheerio = require('cheerio')
const { holdAdmin } = require('../../../../app/auth/permissions')
const createServer = require('../../../../app/server')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
let url
const pageH1 = 'Payment holds'
let auth

describe('Payment holds', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin] } }
    jest.clearAllMocks()
    url = '/payment-holds'
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
        marketingYear: '2022',
        agreementNumber: 'A123456',
        contractNumber: 'A654321',
        holdCategoryName: 'Outstanding debt',
        holdCategorySchemeId: 1,
        holdCategorySchemeName: 'SFI23',
        dateTimeAdded: '2021-08-26T13:29:28.949Z',
        dateTimeClosed: null
      },
      {
        holdId: 4,
        frn: '1111111111',
        marketingYear: '2023',
        agreementNumber: 'S12345678',
        contractNumber: 'S12345678',
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
      expect(get).toHaveBeenCalledWith('/payment-holds?page=1&pageSize=100')
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
        expect(holdCells.eq(3).text()).toEqual(mockPaymentHolds[i].marketingYear)
        expect(holdCells.eq(4).text()).toEqual(mockPaymentHolds[i].contractNumber)
        expect(holdCells.eq(5).text()).toEqual(mockPaymentHolds[i].agreementNumber)
        expect(holdCells.eq(6).text()).toEqual(mockPaymentHolds[i].dateTimeAdded)
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

  describe('GET payment-holds/bulk page', () => {
    const method = 'GET'
    const url = '/payment-holds/bulk'
    const pageH1 = 'Bulk payment holds'

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

  describe('POST payment-holds', () => {
    const method = 'POST'
    const url = '/payment-holds'
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

    const validForm = {
      frn: 1234567890
    }

    test.each([
      { viewCrumb: 'incorrect' },
      { viewCrumb: undefined }
    ])('returns 403 when view crumb is invalid or not included', async ({ viewCrumb }) => {
      const mockForCrumbs = () => mockGetPaymentHold(mockPaymentHolds)
      const { cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      validForm.crumb = viewCrumb
      const res = await server.inject({
        method,
        url,
        auth,
        payload: validForm,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(403)
    })

    test('returns 302 no auth', async () => {
      const mockForCrumbs = () => mockGetPaymentHold(mockPaymentHolds)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      validForm.crumb = viewCrumb
      const res = await server.inject({
        method,
        url,
        payload: validForm,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(302)
    })

    test('returns 200 and correctly lists payment holds when valid crumb and valid FRN provided', async () => {
      const mockForCrumbs = () => mockGetPaymentHold(mockPaymentHolds)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      validForm.crumb = viewCrumb
      const res = await server.inject({
        method,
        url,
        auth,
        payload: validForm,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const holds = $('.govuk-table__body tr')
      expect(holds.length).toBe(1)
      expect(holds.find('td').eq(0).text()).toEqual(validForm.frn.toString())
    })
  })

  describe('POST payment-holds/bulk', () => {
    const CONFIG = { MAX_BYTES: 1048576 }

    const method = 'POST'
    const url = '/payment-holds/bulk'

    const validBulkForm = {
      remove: true,
      holdCategoryId: 123,
      crumb: 'placeholder',
      file: {
        filename: 'bulkHolds.csv',
        path: '/tmp/small-file',
        headers: {
          'content-disposition': 'form-data; name="file"; filename="bulkHolds.csv"',
          'content-type': 'text/csv'
        },
        bytes: 266
      }
    }

    const mockPaymentHoldCategories = [{
      holdCategoryId: 123,
      name: 'my hold category',
      schemeName: 'schemeName'
    }]

    const mockGetPaymentHoldCategories = (categories) => {
      get.mockResolvedValue({ payload: { paymentHoldCategories: categories } })
    }

    test('returns error view for bulk upload when file is too large', async () => {
      const mockForCrumbs = () => mockGetPaymentHoldCategories(mockPaymentHoldCategories)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)

      const invalidForm = {
        ...validBulkForm,
        crumb: viewCrumb,
        file: { ...validBulkForm.file, bytes: CONFIG.MAX_BYTES + 1000 }
      }

      const res = await server.inject({
        method,
        url,
        auth,
        payload: invalidForm,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('body').text()).toMatch(
        new RegExp(`The uploaded file is too large. Please upload a file smaller than ${CONFIG.MAX_BYTES / (1024 * 1024)} MB`)
      )
    })

    test('returns error view for bulk upload when schema validation fails', async () => {
      const mockForCrumbs = () => mockGetPaymentHoldCategories(mockPaymentHoldCategories)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)

      const invalidForm = {
        ...validBulkForm,
        crumb: viewCrumb
      }
      delete invalidForm.file

      const res = await server.inject({
        method,
        url,
        auth,
        payload: invalidForm,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('body').text()).toMatch(/Validation error/)
    })
  })

  describe('GET /payment-holds with pagination', () => {
    const method = 'GET'
    const url = '/payment-holds'
    const mockPaymentHolds = [
      {
        holdId: 1
      }
    ]

    function mockGetPaymentHolds (paymentHolds, page = 1, perPage = 100) {
      const paginatedHolds = paymentHolds.slice((page - 1) * perPage, page * perPage)
      get.mockResolvedValue({ payload: { paymentHolds: paginatedHolds } })
    }

    test('returns the correct page and perPage of results', async () => {
      const page = 1
      const perPage = 1
      mockGetPaymentHolds(mockPaymentHolds, page, perPage)

      const res = await server.inject({ method, url: `${url}?page=${page}&perPage=${perPage}`, auth })

      expect(get).toHaveBeenCalledWith(`/payment-holds?page=${page}&pageSize=${perPage}`)
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      const holds = $('.govuk-table__body tr')
      expect(holds.length).toEqual(1)
    })

    test('defaults to page 1 and perPage 100 if not provided', async () => {
      mockGetPaymentHolds(mockPaymentHolds)

      const res = await server.inject({ method, url, auth })

      expect(get).toHaveBeenCalledWith('/payment-holds?page=1&pageSize=100')
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
    })
  })
})
