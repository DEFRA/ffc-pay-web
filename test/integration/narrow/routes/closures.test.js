jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')
const cheerio = require('cheerio')
const fs = require('fs')
const { closureAdmin } = require('../../../../app/auth/permissions')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../../../../app/constants/payload-sizes')
const createServer = require('../../../../app/server')
const { FRN } = require('../../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')
const { getProcessingData, post } = require('../../../../app/api')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
let auth

const mockGetClosures = () => {
  getProcessingData.mockResolvedValue(
    {
      payload: {
        closures: [{
          frn: FRN,
          agreementNumber: AGREEMENT_NUMBER,
          closureDate: '2023-09-12'
        }]
      }
    }
  )
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

  describe('GET closure/add page', () => {
    const method = 'GET'
    const url = '/closure/add'
    const pageH1 = 'Agreement closure'

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

  describe('GET bulk closure page', () => {
    const method = 'GET'
    const url = '/closure/bulk'
    const pageH1 = 'Bulk agreement closure'

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

  describe('POST /closure/add', () => {
    const method = 'POST'
    const url = '/closure/add'
    const pageH1 = 'Agreement closure'
    test('redirects successful request to \'/\'closure and correctly POSTs hold details', async () => {
      const mockForCrumbs = () => mockGetClosures()
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
      const res = await server.inject({
        method,
        url,
        auth,
        payload: { crumb: viewCrumb, frn: FRN, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023 },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(post).toHaveBeenCalledTimes(1)
      expect(post).toHaveBeenCalledWith('/closure/add', { frn: FRN, agreement: AGREEMENT_NUMBER, date: '2023-08-12T00:00:00' }, null)
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/closure')
    })

    test.each([
      { frn: 10000000001, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a 10-digit FRN' },
      { frn: 999999998, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a 10-digit FRN' },
      { frn: 'not-a-number', agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a 10-digit FRN' },
      { frn: undefined, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a 10-digit FRN' },
      { frn: 1000000000, agreement: undefined, day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid agreement number' },
      { frn: 1000000000, agreement: 'thisstringisreallyreallylongsolonginfactthatitsmorethan50characters', day: 12, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid agreement number' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 35, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid day' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: -4, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid day' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 3.5, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid day' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 'not-a-number', month: 8, year: 2023, expectedErrorMessage: 'Enter a valid day' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: undefined, month: 8, year: 2023, expectedErrorMessage: 'Enter a valid day' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 14, year: 2023, expectedErrorMessage: 'Enter a valid month' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: -8, year: 2023, expectedErrorMessage: 'Enter a valid month' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8.1, year: 2023, expectedErrorMessage: 'Enter a valid month' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 'not-a-number', year: 2023, expectedErrorMessage: 'Enter a valid month' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: undefined, year: 2023, expectedErrorMessage: 'Enter a valid month' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 5323, expectedErrorMessage: 'Enter a valid year' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: -2023, expectedErrorMessage: 'Enter a valid year' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 20.23, expectedErrorMessage: 'Enter a valid year' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 'not-a-number', expectedErrorMessage: 'Enter a valid year' },
      { frn: 1000000000, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: undefined, expectedErrorMessage: 'Enter a valid year' }
    ])('returns 400 and view with errors when request fails validation - %p', async ({ frn, agreement, day, month, year, expectedErrorMessage }) => {
      const mockForCrumbs = () => mockGetClosures()
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)

      const res = await server.inject({
        method,
        url,
        auth,
        payload: { crumb: viewCrumb, frn, agreement, day, month, year },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('.govuk-error-summary__title').text()).toMatch('There is a problem')
      const errorMessage = $('.govuk-error-message')
      expect(errorMessage.text()).toMatch(`Error: ${expectedErrorMessage}`)
    })

    test.each([
      { viewCrumb: 'incorrect' },
      { viewCrumb: undefined }
    ])('returns 403 when view crumb is invalid or not included', async ({ viewCrumb }) => {
      const mockForCrumbs = () => mockGetClosures()
      const { cookieCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)

      const res = await server.inject({
        method,
        url,
        auth,
        payload: { crumb: viewCrumb, frn: FRN, agreement: AGREEMENT_NUMBER, day: 12, month: 8, year: 2023 },
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /closure/bulk', () => {
    const method = 'POST'
    const url = '/closure/bulk'
    const pageH1 = 'Bulk agreement closure'

    test('returns 400 and error message when file size exceeds maximum bytes (413 error)', async () => {
      const mockForCrumbs = () => mockGetClosures()
      const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)

      // Create a payload with a file larger than MAX_BYTES (1MB)
      const largeFileContent = Buffer.alloc(MAX_BYTES + 1).fill('a') // 1MB + 1 byte
      const payload = {
        file: {
          path: '/tmp/large-file.csv',
          bytes: largeFileContent.length,
          filename: 'large-file.csv'
        },
        crumb: viewCrumb
      }

      // Mock file system read
      jest.spyOn(fs, 'readFileSync').mockReturnValue(largeFileContent.toString())

      const res = await server.inject({
        method,
        url,
        auth,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}` }
      })

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toEqual(pageH1)
      expect($('.govuk-error-summary__title').text()).toMatch('There is a problem')
      const errorMessage = $('.govuk-error-message')
      expect(errorMessage.text()).toMatch(`Error: The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`)
    })
  })
})
