jest.mock('../../../../app/api')
jest.mock('../../../../app/storage')
jest.mock('../../../../app/helpers/read-file-content')
jest.mock('../../../../app/helpers/set-loading-status')
jest.mock('../../../../app/auth')

const { postInjection, getHistoricalInjectionData } = require('../../../../app/api')
const { uploadManualPaymentFile } = require('../../../../app/storage')
const { readFileContent } = require('../../../../app/helpers/read-file-content')
const { manualPaymentsAdmin } = require('../../../../app/auth/permissions')
const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
const getCrumbs = require('../../../helpers/get-crumbs')

let server
const auth = { strategy: 'session-auth', credentials: { scope: [manualPaymentsAdmin] } }

beforeEach(async () => {
  jest.clearAllMocks()

  readFileContent.mockReturnValue('file-contents')
  uploadManualPaymentFile.mockResolvedValue()
  postInjection.mockResolvedValue({ jobId: '12345' })

  server = await createServer()

  if (server.initialize) {
    await server.initialize()
  }
})

afterEach(async () => {
  if (server?.stop) {
    await server.stop()
  }
})

describe('Manual Payments Routes', () => {
  describe('GET /manual-payments', () => {
    const url = '/manual-payments'
    const pageH1 = 'Manual payment upload'

    test('returns 200 and page loads correctly', async () => {
      getHistoricalInjectionData.mockResolvedValue({ payload: [] })
      const res = await server.inject({ method: 'GET', url, auth })
      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toContain(pageH1)
    })

    test('renders upload history', async () => {
      getHistoricalInjectionData.mockResolvedValue({ payload: [{ id: 1, filename: 'example.csv', success: true }] })
      const res = await server.inject({ method: 'GET', url, auth })
      expect(res.payload).toContain('example.csv')
    })

    test('graceful if API fails', async () => {
      getHistoricalInjectionData.mockRejectedValue(new Error())
      const res = await server.inject({ method: 'GET', url, auth })
      expect(res.statusCode).toBe(200)
    })

    test('returns 403 if no permission', async () => {
      const restrictedAuth = { strategy: 'session-auth', credentials: { scope: [] } }
      const res = await server.inject({ method: 'GET', url, auth: restrictedAuth })
      expect(res.statusCode).toBe(403)
    })

    test('returns 302 if not authenticated', async () => {
      const res = await server.inject({ method: 'GET', url })
      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/login')
    })
  })

  describe('POST /manual-payments/upload', () => {
    const url = '/manual-payments/upload'

    test('fails if file >1MB', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(() => { }, server, '/manual-payments', auth)
      const payload = Buffer.concat([
        Buffer.from(`--boundary\r\nContent-Disposition: form-data; name="crumb"\r\n\r\n${viewCrumb}\r\n`),
        Buffer.alloc(1048577, 'a'), // 1MB+1
        Buffer.from('--boundary--')
      ])
      const res = await server.inject({
        method: 'POST',
        url,
        payload,
        headers: { cookie: `crumb=${cookieCrumb}`, 'content-type': 'multipart/form-data; boundary=boundary' },
        auth
      })
      expect(res.statusCode).toBe(400)
      expect(res.payload).toContain('File too large')
    })
  })
})
