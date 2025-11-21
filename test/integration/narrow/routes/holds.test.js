jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/helpers/read-file-content')
jest.mock('../../../../app/helpers/set-loading-status')

const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
const { getProcessingData } = require('../../../../app/api')
const { holdAdmin } = require('../../../../app/auth/permissions')
const { readFileContent } = require('../../../../app/helpers/read-file-content')
const getCrumbs = require('../../../helpers/get-crumbs')
const testPageAccess = require('../../../helpers/test-page-access')

let server
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
    const method = 'GET'
    const url = '/payment-holds'
    const pageH1 = 'Payment holds'

    testPageAccess(server, auth, method, url, pageH1)

    test('returns 200 and no hold categories when none returned', async () => {
      getProcessingData.mockResolvedValue({ payload: { paymentHolds: [] } })
      const res = await server.inject({ method, url, auth })
      const $ = cheerio.load(res.payload)
      expect($('#no-hold-text').text()).toBe('There are no payment holds.')
    })
  })

  describe('/payment-holds/bulk page', () => {
    const method = 'GET'
    const url = '/payment-holds/bulk'
    const pageH1 = 'Bulk payment holds'

    testPageAccess(server, auth, method, url, pageH1)
  })

  describe('POST /payment-holds', () => {
    const method = 'POST'
    const url = '/payment-holds'
    const pageH1 = 'Payment holds'
    const mockPaymentHolds = [
      { holdId: 1, frn: '1234567890', holdCategoryName: 'Outstanding debt', holdCategorySchemeName: 'SFI23', dateTimeAdded: '2021-08-26T13:29:28.949Z' }
    ]

    const validForm = { frn: 1234567890 }

    function mockGetPaymentHold (paymentHolds) {
      getProcessingData.mockResolvedValue({ payload: { paymentHolds } })
    }

    test.each([{ viewCrumb: 'incorrect' }, { viewCrumb: undefined }])(
      'returns 403 when view crumb is invalid or not included',
      async ({ viewCrumb }) => {
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
      }
    )

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

    test('returns 200 and correctly lists payment holds', async () => {
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
      expect($('h1').text()).toBe(pageH1)
      expect($('.govuk-table__body tr').length).toBe(1)
      expect($('.govuk-table__body tr td').eq(0).text()).toBe(validForm.frn.toString())
    })
  })

  describe('POST /payment-holds/bulk', () => {
    const method = 'POST'
    const url = '/payment-holds/bulk'
    const mockPaymentHoldCategories = [{ holdCategoryId: 123, name: 'my hold category', schemeName: 'schemeName' }]

    const mockGetPaymentHoldCategories = (paymentHoldCategories) => {
      getProcessingData.mockResolvedValue({ payload: { paymentHoldCategories } })
    }

    beforeEach(() => {
      readFileContent.mockReturnValue('1234567890,2345678901,3456789012')
    })

    const createPayload = (viewCrumb, fileContent) => {
      const boundary = '----WebKitFormBoundaryPovBlTQYGDYVuINo'
      return {
        payload: [
          `--${boundary}`,
          'Content-Disposition: form-data; name="remove"\r\n\r\ntrue',
          `--${boundary}`,
          'Content-Disposition: form-data; name="holdCategoryId"\r\n\r\n123',
          `--${boundary}`,
          'Content-Disposition: form-data; name="crumb"\r\n\r\n' + viewCrumb,
          `--${boundary}`,
          'Content-Disposition: form-data; name="file"; filename="bulkHolds.csv"\r\nContent-Type: text/csv\r\n\r\n' + fileContent,
          `--${boundary}--`
        ].join('\r\n'),
        boundary
      }
    }

    test.each([{ viewCrumb: 'incorrect' }, { viewCrumb: undefined }])(
      'returns 403 when view crumb is invalid or not included',
      async ({ viewCrumb }) => {
        const mockForCrumbs = () => mockGetPaymentHoldCategories(mockPaymentHoldCategories)
        const { cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
        const { payload, boundary } = createPayload(viewCrumb, '1234567890')
        const res = await server.inject({
          method,
          url,
          auth,
          payload,
          headers: { cookie: `crumb=${cookieCrumb}`, 'content-type': `multipart/form-data; boundary=${boundary}` }
        })
        expect(res.statusCode).toBe(403)
      }
    )

    test('returns 302 no auth', async () => {
      const mockForCrumbs = () => mockGetPaymentHoldCategories(mockPaymentHoldCategories)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const { payload, boundary } = createPayload(viewCrumb, '1234567890')
      const res = await server.inject({
        method,
        url,
        payload,
        headers: { cookie: `cookieCrumb=${cookieCrumb}`, 'content-type': `multipart/form-data; boundary=${boundary}` }
      })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })

    test('returns 400 if file size exceeds maximum', async () => {
      const mockForCrumbs = () => mockGetPaymentHoldCategories(mockPaymentHoldCategories)
      const { viewCrumb, cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const largeCsvContent = Buffer.alloc(1048577).fill('1')
      const { payload, boundary } = createPayload(viewCrumb, largeCsvContent)
      const res = await server.inject({
        method,
        url,
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}`, 'content-type': `multipart/form-data; boundary=${boundary}` }
      })
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-error-summary__body').text()).toContain('The uploaded file is too large. Please upload a file smaller than 1 MB')
      expect($('input[name="crumb"]').val()).toBeDefined()
    })
  })

  describe('GET /payment-holds with pagination', () => {
    const method = 'GET'
    const url = '/payment-holds'
    const pageH1 = 'Payment holds'

    const mockPaymentHolds = [{ holdId: 1 }]

    function mockGetPaymentHolds (paymentHolds, page = 1, perPage = 100) {
      const paginatedHolds = paymentHolds.slice((page - 1) * perPage, page * perPage)
      getProcessingData.mockResolvedValue({ payload: { paymentHolds: paginatedHolds } })
    }

    test('returns the correct page and perPage', async () => {
      const page = 1; const perPage = 1
      mockGetPaymentHolds(mockPaymentHolds, page, perPage)
      const res = await server.inject({ method, url: `${url}?page=${page}&perPage=${perPage}`, auth })
      expect(getProcessingData).toHaveBeenCalledWith(`/payment-holds?page=${page}&pageSize=${perPage}`)
      expect(res.statusCode).toBe(200)
      expect(cheerio.load(res.payload)('h1').text()).toBe(pageH1)
    })

    test('defaults to page 1 and perPage 100 if not provided', async () => {
      mockGetPaymentHolds(mockPaymentHolds)
      const res = await server.inject({ method, url, auth })
      expect(getProcessingData).toHaveBeenCalledWith('/payment-holds?page=1&pageSize=100')
      expect(res.statusCode).toBe(200)
      expect(cheerio.load(res.payload)('h1').text()).toBe(pageH1)
    })
  })
})
