jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')

const cheerio = require('cheerio')
const fs = require('fs')
const { closureAdmin } = require('../../../../app/auth/permissions')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../../../../app/constants/payload-sizes')
const createServer = require('../../../../app/server')
const { FRN } = require('../../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')
const { getProcessingData, postProcessing } = require('../../../../app/api')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
let auth

const mockGetClosures = () => {
  getProcessingData.mockResolvedValue({
    payload: {
      closures: [{
        frn: FRN,
        agreementNumber: AGREEMENT_NUMBER,
        closureDate: '2023-09-12'
      }]
    }
  })
}

const loadPage = async (method, url, authOverride) => {
  const res = await server.inject({ method, url, auth: authOverride })
  return { res, $: cheerio.load(res.payload) }
}

describe('Closures', () => {
  beforeEach(async () => {
    auth = { strategy: 'session-auth', credentials: { scope: [closureAdmin] } }
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  const getRoutes = [
    { url: '/closure/add', h1: 'Agreement closure' },
    { url: '/closure/bulk', h1: 'Bulk agreement closure' }
  ]

  describe('GET pages', () => {
    test.each(getRoutes)('%s loads page successfully', async ({ url, h1 }) => {
      const { res, $ } = await loadPage('GET', url, auth)
      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe(h1)
    })

    test.each(getRoutes)('%s returns 403 with no permission', async ({ url }) => {
      auth.credentials.scope = []
      const { res } = await loadPage('GET', url, auth)
      expect(res.statusCode).toBe(403)
    })

    test.each(getRoutes)('%s redirects without auth', async ({ url }) => {
      const { res } = await loadPage('GET', url)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('POST /closure/add', () => {
    const method = 'POST'
    const url = '/closure/add'
    const h1 = 'Agreement closure'

    const postReq = async (payload, cookieCrumb) => server.inject({
      method,
      url,
      auth,
      payload,
      headers: { cookie: `crumb=${cookieCrumb}` }
    })

    test('successful submission posts processing and redirects', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

      const payload = {
        crumb: viewCrumb,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }

      const res = await postReq(payload, cookieCrumb)

      expect(postProcessing).toHaveBeenCalledWith(
        '/closure/add',
        { frn: FRN, agreement: AGREEMENT_NUMBER, date: '2023-08-12T00:00:00' },
        null
      )

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/closure')
    })

    const errorCases = [
      { frn: 10000000001, msg: 'Enter a 10-digit FRN' },
      { frn: 999999998, msg: 'Enter a 10-digit FRN' },
      { frn: 'not-a-number', msg: 'Enter a 10-digit FRN' },
      { frn: undefined, msg: 'Enter a 10-digit FRN' },

      { frn: 1000000000, agreement: undefined, msg: 'Enter a valid agreement number' },
      { frn: 1000000000, agreement: 'x'.repeat(60), msg: 'Enter a valid agreement number' },

      { day: 35, msg: 'Enter a valid day' },
      { day: -4, msg: 'Enter a valid day' },
      { day: 3.5, msg: 'Enter a valid day' },
      { day: 'x', msg: 'Enter a valid day' },
      { day: undefined, msg: 'Enter a valid day' },

      { month: 14, msg: 'Enter a valid month' },
      { month: -8, msg: 'Enter a valid month' },
      { month: 8.1, msg: 'Enter a valid month' },
      { month: 'x', msg: 'Enter a valid month' },
      { month: undefined, msg: 'Enter a valid month' },

      { year: 5323, msg: 'Enter a valid year' },
      { year: -2023, msg: 'Enter a valid year' },
      { year: 20.23, msg: 'Enter a valid year' },
      { year: 'x', msg: 'Enter a valid year' },
      { year: undefined, msg: 'Enter a valid year' }
    ]

    const base = { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023 }

    test.each(errorCases)(
      'returns 400 and error for invalid payload: %p',
      async err => {
        const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

        const res = await postReq({ ...base, ...err, crumb: viewCrumb }, cookieCrumb)
        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(400)
        expect($('h1').text()).toBe(h1)
        expect($('.govuk-error-summary__title').text()).toMatch('There is a problem')
        expect($('.govuk-error-message').text()).toMatch(`Error: ${err.msg}`)
      }
    )

    test.each([
      { crumb: 'invalid' },
      { crumb: undefined }
    ])('403 when crumb invalid: %p', async ({ crumb }) => {
      const { cookieCrumb } = await getCrumbs(mockGetClosures, server, url, auth)
      const res = await postReq({
        crumb,
        frn: FRN,
        agreement: AGREEMENT_NUMBER,
        day: 12,
        month: 8,
        year: 2023
      }, cookieCrumb)

      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /closure/bulk', () => {
    const method = 'POST'
    const url = '/closure/bulk'
    const h1 = 'Bulk agreement closure'

    test('returns 400 when file exceeds max bytes', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockGetClosures, server, url, auth)

      const file = Buffer.alloc(MAX_BYTES + 1).fill('a')
      jest.spyOn(fs, 'readFileSync').mockReturnValue(file.toString())

      const payload = {
        crumb: viewCrumb,
        file: {
          path: '/tmp/x.csv',
          bytes: file.length,
          filename: 'x.csv'
        }
      }

      const res = await server.inject({
        method,
        url,
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toBe(h1)
      expect($('.govuk-error-message').text())
        .toMatch(`Error: The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`)
    })
  })
})
