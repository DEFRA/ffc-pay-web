jest.mock('../../../../app/api')
jest.mock('../../../../app/auth')

const cheerio = require('cheerio')
const createServer = require('../../../../app/server')
const { closureAdmin } = require('../../../../app/auth/permissions')
const { getProcessingData } = require('../../../../app/api')
const getCrumbs = require('../../../helpers/get-crumbs')
const { FRN } = require('../../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')

let server, auth
const url = '/closure'
const pageH1 = 'Agreement closures'

const mockClosures = [{ frn: FRN, agreementNumber: AGREEMENT_NUMBER, schemeName: 'SFI22', closureDate: '2023-09-12' }]
const mockGetClosures = (closures) => {
  getProcessingData.mockResolvedValue({ payload: { closures } })
}

beforeEach(async () => {
  jest.clearAllMocks()
  auth = { strategy: 'session-auth', credentials: { scope: [closureAdmin] } }
  server = await createServer()
})

afterEach(async () => server.stop())

describe('GET /closure', () => {
  test.each([
    { closures: mockClosures, noClosures: false },
    { closures: [], noClosures: true }
  ])('renders closures page %#', async ({ closures, noClosures }) => {
    mockGetClosures(closures)
    const res = await server.inject({ method: 'GET', url, auth })
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toEqual(pageH1)

    if (noClosures) {
      expect(res.payload).toContain('There are no agreement closures.')
    }
  })

  test.each([
    { authOverride: { strategy: 'session-auth', credentials: { scope: [] } }, status: 403 },
    { authOverride: undefined, status: 302, redirect: '/login' }
  ])('handles permission/auth checks %#', async ({ authOverride, status, redirect }) => {
    mockGetClosures(mockClosures)
    const res = await server.inject({ method: 'GET', url, auth: authOverride })
    expect(res.statusCode).toBe(status)

    if (redirect) { expect(res.headers.location).toBe(redirect) }
  })
})

describe('POST /closure/remove', () => {
  test('redirects to /closure', async () => {
    const mockForCrumbs = () => mockGetClosures(mockClosures)
    const { cookieCrumb, viewCrumb } = await getCrumbs(mockForCrumbs, server, url, auth)
    const res = await server.inject({
      method: 'POST',
      url: '/closure/remove',
      auth,
      payload: { crumb: viewCrumb, closedId: '1' },
      headers: { cookie: `crumb=${cookieCrumb}` }
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/closure')
  })
})
