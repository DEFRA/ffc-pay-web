jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
jest.mock('../../../../app/helpers/read-file-content')
jest.mock('../../../../app/helpers/set-loading-status')

const { getProcessingData } = require('../../../../app/api')
const { readFileContent } = require('../../../../app/helpers/read-file-content')
const { holdAdmin } = require('../../../../app/auth/permissions')
const { baseHolds, categories } = require('../../../mocks/objects/holds-mocks')
const createServer = require('../../../../app/server')
const cheerio = require('cheerio')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
let auth

const PAGE = '/payment-holds'
const PAGE_H1 = 'Payment holds'
const BULK_PAGE = '/payment-holds/bulk'

const mockGet = (key, value) => {
  getProcessingData.mockResolvedValue({ payload: { [key]: value } })
}

const multipartPayload = (crumb, fileContent) => {
  const boundary = '----WebKitFormBoundaryPovBlTQYGDYVuINo'
  const parts = [
    `--${boundary}`, 'Content-Disposition: form-data; name="remove"', '', 'true',
    `--${boundary}`, 'Content-Disposition: form-data; name="holdCategoryId"', '', '123',
    `--${boundary}`, 'Content-Disposition: form-data; name="crumb"', '', crumb,
    `--${boundary}`, 'Content-Disposition: form-data; name="file"; filename="bulkHolds.csv"', 'Content-Type: text/csv', '', fileContent,
    `--${boundary}--`
  ]
  return { payload: parts.join('\r\n'), boundary }
}

beforeEach(async () => {
  auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin] } }
  jest.clearAllMocks()
  server = await createServer()
})
afterEach(async () => await server.stop())

const checkFirstRow = ($, hold) => {
  const cells = $('.govuk-table__body td')
  expect(cells.eq(0).text()).toBe(hold.frn)
  expect(cells.eq(1).text()).toBe(hold.holdCategoryName)
  expect(cells.eq(2).text()).toBe(hold.holdCategorySchemeName)
  expect(cells.eq(3).text()).toBe(hold.marketingYear)
  expect(cells.eq(4).text()).toBe(hold.contractNumber)
  expect(cells.eq(5).text()).toBe(hold.agreementNumber)
  expect(cells.eq(6).text()).toBe(hold.dateTimeAdded)
}

describe('Payment Holds', () => {
  const authTests = [
    ['no permission', () => { auth.credentials.scope = [] }, 403],
    ['not authenticated', () => { auth = undefined }, 302]
  ]

  const doGetTest = async (url, h1, key, payload = [], perPage = 100) => {
    mockGet(key, payload)
    const res = await server.inject({ method: 'GET', url, auth })
    expect(getProcessingData).toHaveBeenCalledWith(`${key === 'paymentHolds' ? '/payment-holds' : '/payment-hold-categories'}?page=1&pageSize=${perPage}`)
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toBe(h1)
    return $
  }

  describe('GET /payment-holds', () => {
    test('shows "no holds" when empty', async () => {
      const $ = await doGetTest(PAGE, PAGE_H1, 'paymentHolds', [])
      expect($('#no-hold-text').text()).toBe('There are no payment holds.')
    })

    test.each(authTests)('access control %s', async (_, setup, status) => {
      auth = { strategy: 'session-auth', credentials: { scope: [holdAdmin] } }
      setup()
      const res = await server.inject({ method: 'GET', url: PAGE, auth: status === 403 ? auth : undefined })
      expect(res.statusCode).toBe(status)

      if (status === 302) {
        expect(res.headers.location).toBe('/login')
      }
    })

    test('lists returned hold rows', async () => {
      const $ = await doGetTest(PAGE, PAGE_H1, 'paymentHolds', baseHolds)
      checkFirstRow($, baseHolds[0])
    })

    test('converts SFI -> SFI22', async () => {
      const sfiHolds = JSON.parse(JSON.stringify(baseHolds)).map(h => ({ ...h, holdCategorySchemeName: 'SFI' }))
      const $ = await doGetTest(PAGE, PAGE_H1, 'paymentHolds', sfiHolds)
      expect($('.govuk-table__body td').eq(2).text()).toBe('SFI22')
    })
  })

  describe('POST /payment-holds', () => {
    const validForm = { frn: 1234567890 }
    test.each([{ viewCrumb: 'incorrect' }, { viewCrumb: undefined }])('invalid crumb %p', async ({ viewCrumb }) => {
      const { cookieCrumb } = await getCrumbs(() => mockGet('paymentHolds', baseHolds), server, PAGE, auth)
      const res = await server.inject({
        method: 'POST',
        url: PAGE,
        auth,
        payload: { ...validForm, crumb: viewCrumb },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })
      expect(res.statusCode).toBe(403)
    })

    test('lists holds for valid FRN', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(() => mockGet('paymentHolds', baseHolds), server, PAGE, auth)
      const res = await server.inject({
        method: 'POST',
        url: PAGE,
        auth,
        payload: { ...validForm, crumb: viewCrumb },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      checkFirstRow($, baseHolds[0])
    })
  })

  describe('POST /payment-holds/bulk', () => {
    beforeEach(() => readFileContent.mockReturnValue('1234567890,2345678901,3456789012'))
    test.each([{ viewCrumb: 'incorrect' }, { viewCrumb: undefined }])('invalid crumb %p', async ({ viewCrumb }) => {
      const { cookieCrumb } = await getCrumbs(() => mockGet('paymentHoldCategories', categories), server, BULK_PAGE, auth)
      const { payload, boundary } = multipartPayload(viewCrumb, '1234567890')
      const res = await server.inject({
        method: 'POST',
        url: BULK_PAGE,
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}`, 'content-type': `multipart/form-data; boundary=${boundary}` }
      })
      expect(res.statusCode).toBe(403)
    })

    test('400 when file too large', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(() => mockGet('paymentHoldCategories', categories), server, BULK_PAGE, auth)
      const { payload, boundary } = multipartPayload(viewCrumb, Buffer.alloc(1048577).fill('1'))
      const res = await server.inject({
        method: 'POST',
        url: BULK_PAGE,
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}`, 'content-type': `multipart/form-data; boundary=${boundary}` }
      })
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-error-summary__body').text()).toContain('The uploaded file is too large')
      expect($('input[name="crumb"]').val()).toBeDefined()
    })
  })
})
